const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);

      return { token, user };
    },
    saveBook: async (parent, { authors, description, bookId, image, link, title}, context) => {
      if (context.user) {
        const book = await Book.create({
          authors,
          description,
          bookId,
          image,
          link,
          title,
        });

        await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { book: book.bookId } }
        );

        return book;
      }
      throw new AuthenticationError('You need to be logged in!');
    },

    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const book = await Book.findOneAndDelete({
          bookId: bookId,
        });

        await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { book: book.bookId } }
        );

        return book;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
   
  },

  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate('savedBooks');
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },

  
};

module.exports = resolvers;
