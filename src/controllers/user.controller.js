import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw error; // ✅ just throw, do NOT call next
  }
};

/* ALGORITHM
   1.get user details from frontend
   2.validation--whether it is empty or not
   3.check if user already exists:username, email
   4.check for image,check for avatar
   5.upload them to cloudinary,avatar
   6.create user object-- create entry in DB
   7.remove password and refresh token field from response
   8.check for user creation
   9.return response
   */

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body || {};

  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with Email or Username Already Exists..");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  //const coverImageLocalPath= req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is Required..");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar File is Required..");
  }
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something Went Wrong While Registering User");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, createdUser, "User Registered Succesfully..✅✅")
    );
});

/* ALGORIHTM
 1.Retrieve data from body
 2.Check by username or email
 3.Find the User
 4.Password Check
 5.Access and Refresh Token
 6.Send cookie
  */
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body || {};

  if (!(username || email)) {
    throw new ApiError(400, "Username or Email is required!!!");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }
  const user = await User.findOne({
    $or: [{ username: username?.toLowerCase() }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User Does not Exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User Credentials..");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    " -password -refreshToken "
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully...."
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Access...");
  }

 try {
   const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
   );
 
   const user = await User.findById(decodedToken?._id);
   if (!user) {
     throw new ApiError(401, "Invalid Refresh Token...");
   }
 
   if(incomingRefreshToken !== user?.refreshToken){
     throw new ApiError(401,"Refreshed Token is Expired or Used....")
   }
 
   const options={
     httpOnly:true,
     secure:true
   }
   const {accessToken,newRefreshToken}= await generateAccessAndRefreshTokens(user._id)
 
   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",newRefreshToken,options)
   .json(
     new ApiResponse(200,
       {accessToken , refreshToken:newRefreshToken},
       "Access Token Refreshed"
     )
   )
 } catch (error) {
  throw new ApiError(401,error?.message|| "Invalid Refresh Token")
 }

});

export { registerUser, loginUser, logOutUser, refreshAccessToken};
