const registerValid = (name, email, password, cf_password) => {
  if (!name) return "Please enter your name";
  if (!email) return "Please enter your email";
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  
  if (!password) return "Please enter your password";
  if (password.length < 6) return "Password must be at least 6 characters";
  // eslint-disable-next-line security/detect-possible-timing-attacks
  if (password !== cf_password) return "Password did not match";
};

const loginValid = (email, password) => {
  if (!email) return "Please enter your email";
  if (!password) return "Please enter your password";
};

const addFoodErrorHandler = (name, category, price, description, image) => {
  if (!name) return "Please enter food name";
  if (!category) return "Please enter food category";
  if (!price || price <= 0) return "Please enter valid food price";
  if (!description) return "Please enter food description";
  if (!image) return "Please add food image";
};

const makeOrderErrorHandler = (name, email, foodName, address) => {
  if (!name) return "Please enter your name";
  if (!email) return "Please enter your email";
  if (!foodName) return "Please select food items";
  if (!address) return "Please enter delivery address";
};

module.exports = {
  registerValid,
  loginValid,
  addFoodErrorHandler,
  makeOrderErrorHandler,
};
