const httpResponse = require("../helper/httpResponse");

const create = async (res, model, payload) => {
  try {
    const result = await model.create(payload);

    if (result) {
      return httpResponse.createdResponse(res, "Data Created");
    }
  } catch (error) {
    return httpResponse.serverErrorResponse(res, error.message);
  }
};

const update = async (res, model, payload, id) => {
  try {
    const result = await model.update(payload, {
      where: { id: id },
    });

    if (result[0] === 0) {
      return httpResponse.notFoundResponse(res, "Data Not Found");
    } else {
      return httpResponse.successResponse(res, "Data Updated");
    }
  } catch (error) {
    return httpResponse.serverErrorResponse(res, error.message);
  }
};

const deleted = async (res, model, id) => {
  try {
    const result = await model.destroy({
      where: { id: id },
    });

    if (result) {
      return httpResponse.successResponse(res, "Data Deleted");
    } else {
      return httpResponse.notFoundResponse(res, "Data Not Found");
    }
  } catch (error) {
    return httpResponse.serverErrorResponse(res, error.message);
  }
};

const find = async (res, model, limit, page, include, condition) => {
  try {
    if (limit === 0 && page === 0) {
      const result = await model.findAll({
        where: condition || "",
        include: include || "",
      });

      if (result) {
        return httpResponse.successResponse(res, result);
      }
    } else {
      const offset = (page - 1) * limit;
    const { rows: result, count } = await model.findAndCountAll({
      where: condition || "",
      include: include || "",
      limit,
      offset,
    });

    if (result) {
      return httpResponse.successResponsePagination(
        res,
        result,
        page,
        limit,
        count
      );
    }
    }
  } catch (error) {
    return httpResponse.serverErrorResponse(res, error.message);
  }
};

const findOne = async (res, model, id, include) => {
  try {
    const result = await model.findByPk(id, {
      include: include || "",
    });

    if (result) {
      return httpResponse.successResponse(res, result);
    } else {
      return httpResponse.notFoundResponse(res, "Data Not Found");
    }
  } catch (error) {
    return httpResponse.serverErrorResponse(res, error.message);
  }
};

module.exports = {
  find,
  findOne,
  create,
  update,
  deleted,
};
