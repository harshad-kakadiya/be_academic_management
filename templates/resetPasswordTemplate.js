const getOTPMailTemplate = (otp, user = "User",) => {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>OTP Email</title>
  </head>
  <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #f3f4f6; color: #333;">
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table style="max-width:600px; width:100%; margin:20px auto; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
            <tr>
              <td style="background-color:#4f46e5; padding:20px 30px; text-align:center;">
                <h2 style="color:#ffffff; margin:0;">Academic Management System</h2>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;">
                <h3 style="margin-top:0;">Hello ${user?.firstName}(${user.userName}),</h3>
                <p style="font-size:15px;">You recently requested to reset your password.</p>
                <p style="font-size:15px;">Please use the OTP below to proceed with resetting your password:</p>
                <div style="margin:30px 0; text-align:center;">
                  <span style="font-size:36px; font-weight:bold; color:#4f46e5;">${otp}</span>
                </div>
                <p style="font-size:15px;">This OTP is valid for <strong>1 minute</strong>.</p>
                <p style="font-size:14px;">If you did not request this, please ignore this email or contact support.</p>
                <br/>
                <p style="font-size:14px;">Thank you,<br/>Academic Management Team</p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f9fafb; padding:20px 30px; text-align:center; font-size:12px; color:#6b7280;">
                This is an automated message — please do not reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

module.exports = {getOTPMailTemplate};
