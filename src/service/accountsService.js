const {
  Accounts,
  UserProfile,
  PanitiaProfiles,
  Panitias,
  Kabupatens,
  Kecamatans,
  Kelurahans,
  Tps,
} = require("../models");
const httpResponse = require("../helper/httpResponse");
const { comparePassword } = require("../tools/bcrypt/bcryptConfig");
const { generateToken } = require("../tools/jwt/jwtConfig");

const createAccount = async (res, payload, model, type) => {
  try {
    const newAccount = await model.create({
      email: payload.email,
      password: payload.password,
    });

    if (type === 0) {
      if (newAccount) {
        const payloadProfile = {
          fullname: payload.fullname,
          address: payload.address,
          phone: payload.phone,
          accountId: newAccount.id,
        };
        await createProfile(res, payloadProfile, UserProfile);
      }
    } else {
      if (newAccount) {
        const payloadProfile = {
          nama_panitia: payload.nama_panitia,
          nik: payload.nik,
          no_telp: payload.no_telp,
          kabupatenId: payload.kabupatenId,
          kecamatanId: payload.kecamatanId,
          kelurahanId: payload.kelurahanId,
          tpsId: payload.tpsId,
          panitiaId: newAccount.id,
          role: payload.role,
        };
        await createProfile(res, payloadProfile, PanitiaProfiles);
      }
    }
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return httpResponse.badRequestResponse(res, "Email has been registered");
    } else {
      return httpResponse.serverErrorResponse(res, error.message);
    }
  }
};

const createProfile = async (res, payload, model) => {
  try {
    const newProfile = await model.create(payload);

    if (newProfile) {
      return httpResponse.createdResponse(res, "Register Account Successfully");
    }
  } catch (error) {
    return httpResponse.serverErrorResponse(res, error.message);
  }
};

const loginAccount = async (res, payload, type) => {
  try {
    let result;
    if (type === 0) {
      result = await Accounts.findOne({
        where: {
          email: payload.email,
        },
        include: {
          model: UserProfile,
          attributes: ["id", "fullname"],
        },
      });
    } else {
      result = await Panitias.findOne({
        where: {
          email: payload.email,
        },
        include: {
          model: PanitiaProfiles,
          include: [
            {
              model: Kabupatens,
              attributes: ["id", "nama_kabupaten"],
            },
            {
              model: Kecamatans,
              attributes: ["id", "nama_kecamatan"],
            },
            {
              model: Kelurahans,
              attributes: ["id", "nama_kelurahan"],
            },
            {
              model: Tps,
              attributes: ["id", "nama_tps"],
            },
          ]
        },
      });
    }

    const data = result.dataValues;

    if (data) {
      const passwordMatch = comparePassword(payload.password, result.password);

      if (!passwordMatch) {
        return httpResponse.serverErrorResponse(res, "Invalid Password");
      }

      let token;
      let dataToken;

      if (type === 0) {
        dataToken = {
          id: data.id,
          email: data.email,
          isActive: data.isActive,
          profileId: data.user_profile.id,
          fullname: data.user_profile.fullname,
        };
        token = generateToken(dataToken);
      } else {
        dataToken = {
          id: data.id,
          email: data.email,
          isActive: data.isActive,
          profile: data.panitia_profile,
        };
        token = generateToken(dataToken);
      }

      return httpResponse.successResponse(res, { akun: dataToken, token });
    } else {
      return httpResponse.notFoundResponse(res, "Email not Registered");
    }
  } catch (error) {
    return httpResponse.serverErrorResponse(res, error.message);
  }
};

module.exports = {
  createAccount,
  createProfile,
  loginAccount,
};
