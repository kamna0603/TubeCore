/*ApiResponse is a custom response class used to send consistent and structured success responses from backend APIs.
Different APIs may return responses in different formats
Frontend expects a fixed structure
Clean & predictable API responses are required
ApiResponse standardizes all success responses. 
*/

class ApiResponse{
    constructor(statusCode,data,message="success"){
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success=statusCode < 400 //Automatically sets success/failure based on status  
    }
}

export {ApiResponse}