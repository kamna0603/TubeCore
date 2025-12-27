/*asyncHandler is a utility function used to handle errors in async route handlers automatically.
In Express:Async errors are NOT caught automatically
What asyncHandler Does it:

Wraps an async function
Catches any error
Sends it to Express error middleware using next(err)
*/
const asyncHandler = (requestHandler) => {
   return (req, res, next) => {
    Promise
    .resolve(requestHandler(req, res, next))
    .catch((err) => next(err));
  };
};

export { asyncHandler };
