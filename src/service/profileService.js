const httpResponse = require("../helper/httpResponse");

const updateDetail = async (res, model, detailModel, payload, id) => {
    try {
      const result = await model.update(payload, {
        where: { id: id },
      });
  
      if (result[0] === 0) {
        if (payload?.detail) {
            const dataDetail = await model.findOne({
                where: { id: id },
                include: [
                {
                    model: detailModel,
                },
                ],
            });
            if (dataDetail?.dataValues?.panitia_profile) {
                await detailModel.update(payload.detail, {
                where: { id: dataDetail?.dataValues?.panitia_profile?.dataValues?.id },
                });
                return httpResponse.successResponse(res, "Data Updated");
            }
        } else {
            return httpResponse.notFoundResponse(res, "Data Not Found");
        }
      } else {
        if (payload?.detail) {
            const dataDetail = await model.findOne({
                where: { id: id },
                include: [
                    {
                        model: detailModel,
                    },
                ],
            });
            await detailModel.update(payload.detail, {
                where: { id: dataDetail?.dataValues?.panitia_profile?.dataValues?.id },
            });
            
            return httpResponse.successResponse(res, "Data Updated");
        } else {
            return httpResponse.successResponse(res, "Data Updated");
        
        }
      }
    } catch (error) {
      return httpResponse.serverErrorResponse(res, error.message);
    }
  };

module.exports = {
    updateDetail,
}