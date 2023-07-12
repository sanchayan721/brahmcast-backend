const User = require('../model/User');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    console.log(cookies)
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;

    //const { email } = req.body;
    //if (!email) return res.status(400).json({ 'message': 'Bad Request! Please send email.' });

    // Decode the Refresh Token
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err || !decoded?.email || !decoded?.username) {
                return res.send(403).json({ "message": "Invalid Token! Please login." });
            }

            let { email } = decoded;

            // Checking if the user session is blacklisted
            const foundInCache = await redisClient.GET(email);
            if (!foundInCache) return res.status(403).json({ "message": "Session Blacklisted! Please login." });

            if (!foundInCache.match(refreshToken)) {
                let deleteResponseCode = await redisClient.DEL(email);
                if (deleteResponseCode == 1) return res.status(403).json({ "message": "Session Blacklisted! Please login." });
            }

            // Finding User in MongoDB
            const foundUser = await User.findOne({ email }).exec();
            if (!foundUser) return res.status(401).json({ 'message': 'Not a registered user? Please register.' });

            const roles = Object.values(foundUser.roles).filter(el => el !== undefined);

            // Creating New Access Token
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

            // Creating New Refresh Token 
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
                    res.status(500).json({'message': 'Server error! Please try again.'});
                });

            res.status(200).json({ roles, accessToken })
        }
    )

    /* const foundUser = await User.findOne({ email: email }).exec();
    if (!foundUser) return res.status(403).json({ 'message': 'Not a registered user? Please register.' });

    const foundInCache = await redisClient.GET(email);
    if (!foundInCache || !foundInCache.match(refreshToken)) {
        return res.sendStatus(403); //Forbidden 
    } else {
        // evaluate jwt 
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                if (err || foundUser.email !== decoded.email) return res.sendStatus(403);
                const roles = Object.values(foundUser.roles).filter(el => el !== undefined);
                const accessToken = jwt.sign(
                    {
                        "UserInfo": {
                            "username": foundUser.username,
                            "email": decoded.email,
                            "roles": roles
                        }
                    },
                    process.env.ACCESS_TOKEN_SECRET,
                    {
                        expiresIn: Number(process.env.ACCESS_EXPIRE)
                    }
                );
                res.json({ roles, accessToken })
            }
        );
    } */
}

module.exports = { handleRefreshToken }