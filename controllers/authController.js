const User = require('../model/User');
const redisClient = require('../config/redis');
const jwt = require('jsonwebtoken');

const DAY_IN_MIL_SECONDS = 24 * 60 * 60 * 1000;
const DAY_IN_SECONDS = 24 * 60 * 60;

const handleLogin = async (req, res) => {

    const { username_email, password } = req.body;
    if (!username_email || !password) return res.status(400).json({ 'message': 'Username and password are required.' });

    const foundUser = await User.findOne({
        $or: [{ username: username_email }, { email: username_email }]
    }).select("+password").exec(); // Password field is not selected by default

    if (!foundUser) return res.status(401).json({ 'message': 'No user found! Please Register.' }); //Unauthorized 

    // evaluate password 
    const match = await foundUser.matchPasswords(password);
    if (match) {
        const roles = Object.values(foundUser.roles).filter(Boolean);
        const username = foundUser.username;
        // create JWTs
        const accessToken = jwt.sign(
            {
                "UserInfo": {
                    "username": foundUser.username,
                    "email": foundUser.email,
                    "roles": roles
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: Number(process.env.ACCESS_EXPIRE)
            }
        );

        const refreshToken = jwt.sign(
            {
                "username": foundUser.username,
                "email": foundUser.email
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: `${process.env.REFRESH_EXPIRE}d`
            }
        );

        // Saving refreshToken in Redis Client
        await redisClient
            .multi()
            .SET(foundUser.email, refreshToken)
            .EXPIRE(foundUser.email, Number(process.env.REFRESH_EXPIRE) * DAY_IN_SECONDS)
            .exec()
            .then(() => {
                // Creates Secure Cookie with refresh token
                res.cookie(
                    'jwt',
                    refreshToken,
                    {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'None',
                        maxAge: Number(process.env.REFRESH_EXPIRE) * DAY_IN_MIL_SECONDS
                    }
                );
            })
            .catch((err) => {
                console.error(err);

                // Send a Server Error Status
                res
                    .status(500)
                    .json({
                        'message': 'Server error! Please try again.'
                    });
            });

        const result = await foundUser.save();

        // Send authorization roles and access token to user
        res.status(200).json({ username, roles, accessToken });

    } else {
        res.status(401).json({'message': 'Wrong Username or Password!'});
    }
}

module.exports = { handleLogin };