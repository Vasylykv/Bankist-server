module.exports = class UserDto {
  email;
  id;
  movements;

  constructor(model) {
    this.email = model.email;
    this.id = model._id;
    this.movements = model.movements;
  }
};
