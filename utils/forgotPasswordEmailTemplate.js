
const ForgotPasswordEmail = (username, otp) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
        }

        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header {
            text-align: center;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .header h1 {
            color: #4CAF50;
        }

        .content {
            text-align: center;
        }

        .content p {
            font-size: 15px;
            line-height: 1.5;
        }

        .otp {
            font-size: 20px;
            font-weight: bold;
            color: #4CAF50;
            margin: 20px 0;
            letter-spacing: 5px;
        }

        .footer {
            text-align: center;
            font-size: 14px;
            color: #777;
            margin-top: 20px;
        }
    </style>
</head>

<body>
    <div class="container">

        <div class="header">
            <h1>Hi ${username}, Reset Your Password</h1>
        </div>

        <div class="content">
            <p>
                We received a request to reset your account password.
                Please use the OTP below to verify your identity.
            </p>

            <div class="otp">${otp}</div>

            <p>
                This OTP is valid for 2 minutes.
                Please do not share this code with anyone.
            </p>

            <p>
                If you did not request a password reset,
                you can safely ignore this email.
            </p>
        </div>

        <div class="footer">
            <p>
                &copy; ${new Date().getFullYear()}
                BoroBazar. All rights reserved.
            </p>
        </div>

    </div>
</body>
</html>
`;
};

export default ForgotPasswordEmail;
