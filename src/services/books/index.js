const express = require("express")

const { getBooks, writeBooks } = require("../../fsUtilities")
const {check, validationResult} = require("express-validator")
const uniqid = require("uniqid")

const booksRouter = express.Router()

const booksValidation = [
  check("title").exists().withMessage("Title is required!"),
  check("category").exists().withMessage("Category is required!"),
  check("price").exists().withMessage("Price is required!"),
  // check("img").exists().withMessage("Img is required!"),
  check("asin").exists().withMessage("Asin is required!"),
]

const commentsValidation = [
  check("text").exists().withMessage("Title is required!"),
  check("userName").exists().withMessage("Category is required!"),
]
//BOOKS

booksRouter.get("/", async (req, res, next) => {
  try {
    const books = await getBooks()

    if (req.query && req.query.category) {
      const filteredBooks = books.filter(
        book =>
          book.hasOwnProperty("category") &&
          book.category === req.query.category
      )
      res.send(filteredBooks)
    } else {
      res.send(books)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

booksRouter.get("/:asin", async (req, res, next) => {
  try {
    const books = await getBooks()

    const bookFound = books.find(book => book.asin === req.params.asin)

    if (bookFound) {
      res.send(bookFound)
    } else {
      const err = new Error()
      err.httpStatusCode = 404
      next(err)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

booksRouter.post("/", booksValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const error = new Error()
      error.message = errors
      error.httpStatusCode = 400
      next(error)
    } else {
      const books = await getBooks()

      const asinFound = books.find(book => book.asin === req.body.asin)

      if (asinFound) {
        const error = new Error()
        error.httpStatusCode = 400
        error.message = "Book already in db"
        next(error)
      } else {
        books.push({...req.body, comments: [] ,createdAt: new Date()})
        await writeBooks(books)
        res.status(201).send({ asin: req.body.asin })
      }
    }
  } catch (error) {
    console.log(error)
    const err = new Error("An error occurred while reading from the file")
    next(err)
  }
})

booksRouter.put("/:asin", async (req, res, next) => {
  try {
    const validatedData = matchedData(req)
    const books = await getBooks()

    const bookIndex = books.findIndex(book => book.asin === req.params.asin)

    if (bookIndex !== -1) {
      // book found
      const updatedBooks = [
        ...books.slice(0, bookIndex),
        { ...books[bookIndex], ...validatedData },
        ...books.slice(bookIndex + 1),
      ]
      await writeBooks(updatedBooks)
      res.send(updatedBooks)
    } else {
      const err = new Error()
      err.httpStatusCode = 404
      next(err)
    }
  } catch (error) {
    console.log(error)
    const err = new Error("An error occurred while reading from the file")
    next(err)
  }
})

booksRouter.delete("/:asin", async (req, res, next) => {
  try {
    const books = await getBooks()

    const bookFound = books.find(book => book.asin === req.params.asin)

    if (bookFound) {
      const filteredBooks = books.filter(book => book.asin !== req.params.asin)

      await writeBooks(filteredBooks)
      res.status(204).send()
    } else {
      const error = new Error()
      error.httpStatusCode = 404
      next(error)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

//COMMENTS


booksRouter.get("/:asin/comments", async (req, res, next) => {
  try {
    const books = await getBooks()

    const bookFound = books.find(book => book.asin === req.params.asin)

    if (bookFound) {
      if(!bookFound.comments.isEmpty()){
        res.send(bookFound.comments)
      }else{
        res.send("No comment")
      }
    } else {
      const err = new Error()
      err.httpStatusCode = 404
      next(err)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

booksRouter.post("/:asin/comments", commentsValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const error = new Error()
      error.message = errors
      error.httpStatusCode = 400
      next(error)
    } else {
      const books = await getBooks()

      const bookFound = books.find(book => book.asin === req.params.asin)

      if (!bookFound) {
        const error = new Error()
        error.httpStatusCode = 404
        next(error)
      } else {
        bookFound.comments.push({
          ...req.body, 
          createdAt: new Date(), 
          commentID: uniqid()})
        await writeBooks(books)
        res.status(201).send(bookFound.comments)
      }
    }
  } catch (error) {
    console.log(error)
    const err = new Error("An error occurred while reading from the file")
    next(err)
  }
})

booksRouter.delete("/:asin/comments/:commentID", async (req, res, next) => {
  try {
    const books = await getBooks()

    const bookIndex = books.findIndex(book => book.asin === req.params.asin)

    if (bookIndex !== -1) {
      const commentIndex = books[bookIndex].comments.findIndex(comment => comment.commentID === req.params.commentID)
      
      if(commentIndex !== -1){
        books[bookIndex].comments = books[bookIndex].comments.filter(comment => comment.commentID !== req.params.commentID)
  
        await writeBooks(books)
        res.status(204).send()
      }else{
        const error = new Error()
        error.httpStatusCode = 404
        next(error) 
      }

    } else {
      const error = new Error()
      error.httpStatusCode = 404
      next(error)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

module.exports = booksRouter
