const httpResponse = require("../helper/httpResponse");
const {
  Suaras,
  SuaraCalons,
  Panitias,
  PanitiaProfiles,
  Tps,
} = require("../models");

const inputSuaraService = async (res, data, payload) => {
  try {
    const payloadSuara = {
      input_by: data.id,
      url_c1: payload.url_c1,
      status_suara: "Pending",
    };

    //validate total_suara from max_suara on tps
    if (payload?.suara_calon) {
      console.log(payload.suara_calon);
      const suaraCalonArray = payload.suara_calon;
      let totalSuara = 0;
      suaraCalonArray.map(async (item) => {
        totalSuara += parseInt(item.total_suara);
      });

      const dataTps = await Panitias.findByPk(data.id, {
        include: {
          model: PanitiaProfiles,
          include: {
            model: Tps,
            attributes: ["id", "max_surat_suara"],
          },
        },
      });

      const suaraMax =
        dataTps.dataValues.panitia_profile?.dataValues?.tp.dataValues
          .max_surat_suara;

      console.log(suaraMax);

      if (totalSuara > suaraMax) {
        return httpResponse.badRequestResponse(
          res,
          "Total Suara Melebihi Batas"
        );
      }
    }

    const result = await Suaras.create(payloadSuara);

    if (result) {
      console.log(payload);
      if (payload?.suara_calon) {
        const suaraCalonArray = payload.suara_calon;
        console.log(result);

        suaraCalonArray.map(async (item) => {
          const payloadSuaraCalon = {
            suaraId: result.dataValues.id,
            calonId: item.calonId,
            total_suara: item.total_suara,
          };

          await SuaraCalons.create(payloadSuaraCalon);
        });

        return httpResponse.successResponse(res, "Suara Berhasil Diinput");
      }
    }
  } catch (error) {
    return httpResponse.serverErrorResponse(res, error.message);
  }
};

module.exports = {
  inputSuaraService,
};
