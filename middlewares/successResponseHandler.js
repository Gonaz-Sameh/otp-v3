 const successResponseHandler = (res ,data = null,statusCode = 200)=>{
    //res is required
    //data is optional - its default is null
   // statusCode is optional - its default is 200
    return res.status(statusCode).json({
        status:"success",
        data:data
    });
    }

module.exports = successResponseHandler;