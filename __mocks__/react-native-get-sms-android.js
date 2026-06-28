// Jest mock for react-native-get-sms-android
module.exports = {
  default: {
    list: jest.fn(function(filterJSON, fail, success) {
      success(0, '[]');
    })
  }
};
