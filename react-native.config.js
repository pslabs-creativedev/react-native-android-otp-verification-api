module.exports = {
  dependency: {
    platforms: {
      android: {
        packageImportPath:
          'import com.androidotpverificationapi.AndroidOtpVerificationApiPackage;',
        packageInstance: 'new AndroidOtpVerificationApiPackage()',
      },
      ios: null,
    },
  },
};
