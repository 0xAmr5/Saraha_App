export const create = async ({ model, data = {} } = {}) => {
    return await model.create(data);
};

export const findOne = async ({ model, filter = {}, options = {} } = {}) => {
    const doc = model.findOne(filter);
    if (options.select) doc.select(options.select);
    if (options.populate) doc.populate(options.populate);
    return await doc.exec();
};
