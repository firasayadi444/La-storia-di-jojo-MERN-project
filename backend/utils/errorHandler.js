const registerValid = (name, email, password, cf_password) => {
  if (!name) return "Please enter your name";
  if (!email) return "Please enter your email";
  if (!password) return "Please enter your password";
  if (password.length < 6) return "Password must be at least 6 characters";
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

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

module.exports = {
  registerValid,
  loginValid,
  addFoodErrorHandler,
  makeOrderErrorHandler,
};
