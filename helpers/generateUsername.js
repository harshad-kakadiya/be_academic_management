const UserModel = require("../models/user");

const specialChars = ['#', '!', '@', '$', '%', '^', '&', '*', '?'];

const generateUniqueUsername = async (companyName, firstName, lastName = "") => {
    const randomChar = () => specialChars[Math.floor(Math.random() * specialChars.length)];
    const randomDigits = () => Math.floor(100 + Math.random() * 900);

    const cleanCompany = companyName.toLowerCase().replace(/\s+/g, "").slice(0, 5);
    const cleanName = (firstName + (lastName?.[0] || "")).toLowerCase().replace(/\s+/g, "").slice(0, 5);

    let userName;
    let exists = true;

    while (exists) {
        userName = `${cleanCompany}${randomChar()}${randomDigits()}${cleanName}`;
        exists = await UserModel.exists({ userName, deletedAt: null });
    }

    return userName;
};

module.exports = generateUniqueUsername;
