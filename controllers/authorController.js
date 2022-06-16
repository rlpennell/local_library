const async = require('async');
const { body, validationResult } = require('express-validator');

const Author = require('../models/author');
const Book = require('../models/book');

exports.author_list = function (req, res, next) {
  Author.find()
    .sort([['family_name', 'ascending']])
    .exec(function (err, list_authors) {
      if (err) return next(err);
      res.render('author_list', {
        title: 'Author List',
        author_list: list_authors,
      });
    });
};

exports.author_detail = function (req, res, next) {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.params.id).exec(callback);
      },
      authors_books: function (callback) {
        Book.find({ author: req.params.id }, 'title summary').exec(callback);
      },
    },
    function (err, results) {
      if (err) return next(err);

      if (results.author == null) {
        let err = new Error('Author not found');
        err.status = 404;
        return next(err);
      }

      res.render('author_detail', {
        title: 'Author detail',
        author: results.author,
        authors_books: results.authors_books,
      });
    }
  );
};

exports.author_create_get = function (req, res) {
  res.render('author_form', { title: 'Create Author' });
};

exports.author_create_post = [
  body('first_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('First name is required.')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters.'),
  body('date_of_birth', 'Invalid date of birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('author_form', {
        title: 'Create Author',
        author: req.body,
        errors: errors.array(),
      });

      return;
    } else {
      var author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
      });

      author.save(function (err) {
        if (err) return next(err);

        res.redirect(author.url);
      });
    }
  },
];

// Display Author delete form on GET.
exports.author_delete_get = function (req, res, next) {
  async.parallel(
    {
      author: callback => Author.findById(req.params.id).exec(callback),
      author_books: callback =>
        Book.find({ author: req.params.id }).exec(callback),
    },
    (err, { author, author_books }) => {
      if (err) return next(err);

      if (!author) res.redirect('/catalog/authors');

      res.render('author_delete', {
        title: 'Delete Author',
        author,
        author_books,
      });
    }
  );
};

// Handle Author delete on POST.
exports.author_delete_post = function (req, res, err) {
  async.parallel(
    {
      author: callback => Author.findById(req.body.authorid).exec(callback),
      author_books: callback =>
        Book.find({ author: req.body.authorid }).exec(callback),
    },
    (err, { author, author_books }) => {
      if (err) return next(err);
      if (author_books.length > 0) {
        res.render('author_delete', {
          title: 'Delete Author',
          author,
          author_books,
        });
        return;
      } else {
        Author.findByIdAndRemove(req.body.authorid, err => {
          if (err) return next(err);

          res.redirect('/catalog/authors');
        });
      }
    }
  );
};

// Display Author update form on GET.
exports.author_update_get = function (req, res, next) {
  Author.findById(req.params.id).exec((err, author) => {
    if (err) return next(err);

    console.log(author.date_of_birth.toISOString().slice(0, 10));

    res.render('author_form', { title: 'Update Author', author });
  });
};

// Handle Author update on POST.
exports.author_update_post = [
  body('first_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('First name is required.')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters.'),
  body('date_of_birth', 'Invalid date of birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('author_form', {
        title: 'Create Author',
        author: req.body,
        errors: errors.array(),
      });

      return;
    } else {
      let author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
        _id: req.params.id,
      });

      Author.findByIdAndUpdate(
        req.params.id,
        author,
        {},
        (err, updatedAuthor) => {
          if (err) return next(err);

          res.redirect(updatedAuthor.url);
        }
      );
    }
  },
];
