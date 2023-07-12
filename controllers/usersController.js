const User = require('../model/User');

const getAllUsers = async (req, res) => {
    const users = await User.find().lean();
    if (!users) return res.status(204).json({ 'message': 'No users found' });
    res.json(users);
}

const deleteUser = async (req, res) => {
    if (!req?.body?.username) return res.status(400).json({ "message": 'Username required' });
    const user = await User.findOne({ username: req.body.username }).exec();
    if (!user) {
        return res.status(204).json({ 'message': `Username ${req.body.username} not found` });
    }
    const result = await user.deleteOne({ username: req.body.username });
    res.json(result);
}

const getUser = async (req, res) => {
    if (!req?.params?.username) return res.status(400).json({ "message": 'Username required' });
    const user = await User.findOne({ username: req.params.username }).exec();
    if (!user) {
        return res.status(204).json({ 'message': `Username ${req.params.username} not found` });
    }
    res.json(user);
}

module.exports = {
    getAllUsers,
    deleteUser,
    getUser
}