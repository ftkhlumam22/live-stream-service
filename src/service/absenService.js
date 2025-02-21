const { Absens } = require("../models");
const httpResponse = require("../helper/httpResponse");

const absenUserService = async (res, data, payload) => {
    const dataAbsen = await Absens.findAndCountAll({where: {userId: data.id}})

    if (dataAbsen?.count > 0) {
        const now = new Date();
        const lastLogin = new Date(dataAbsen?.rows[0]?.dataValues.last_absen);

        if (lastLogin < new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)) {
            await Absens.update(payload, {where: {userId: data.id}});
            return httpResponse.successResponse(res, "Absen Berhasil");
        } else {
            return httpResponse.serverErrorResponse(res, "Anda Sudah Absen Hari Ini");
        }
    } else {
        payload.userId = data.id;
        await Absens.create(payload);
        return httpResponse.successResponse(res, "Absen Berhasil");
    }
}

module.exports = {
    absenUserService,
}