
const userRoute = require('./userRoute');
const authRoute = require('./authRoute');
const organizationRoute = require('./organizationRoute');
const otpRoute = require('./otpRoute');
const emailRoute = require('./emailRoute');
const mountRoutes = (app) => {

  app.use('/api/v1/users', userRoute);
  app.use('/api/v1/auth', authRoute);
  app.use('/api/v1/organizations',organizationRoute);
  app.use('/api/v1/otp', otpRoute);
  app.use('/api/v1/emails', emailRoute);
};

module.exports = mountRoutes;
