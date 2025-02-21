const { Suaras, SuaraCalons, Calons } = require("../models");
const httpResponse = require("../helper/httpResponse");
const { col, where } = require("sequelize");

const dashboardSuaraService = async (res) => {
  try {
    const suara = await Suaras.findAll({
      include: [
        {
          model: SuaraCalons,
          include: [
            {
              model: Calons,
            },
          ],
        },
      ],
      where: [
        {
          status_suara: "Suara Di Terima"
        }
      ]
    });

    const calon = await Calons.findAll();

    if (suara) {
      const suaraCalon = [];
      calon.map((item) => {
        let suaraTiapCalon = 0;
        suara.map((data) => {
          data.dataValues.suara_calons.map((datas) => {
            if (datas.dataValues.calonId === item.id) {
              suaraTiapCalon += datas.dataValues.total_suara;
            }
          });
        });

        suaraCalon.push(suaraTiapCalon);
      });

      const totalSuara = suaraCalon.reduce((acc, cur) => acc + cur, 0);
      const percentage = suaraCalon.map((item) => (item / totalSuara) * 100);

      const color = [];
      const datasetColor = ["indigo-500", "blue-500", "red-500", "grey-500"];
      suaraCalon.map((item, index) => {
        color.push(datasetColor[index % datasetColor.length]);
      });

      const responseData = {
        calon: calon.map((item) => item?.dataValues?.nama_calon),
        vote: suaraCalon,
        percentage: percentage.map((item) => item.toFixed(2) + "%"),
        color: color,
      };
      return httpResponse.successResponse(res, responseData);
    }
  } catch (error) {
    return httpResponse.serverErrorResponse(res, error.message);
  }
};

module.exports = {
  dashboardSuaraService,
};
