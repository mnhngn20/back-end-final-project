import { RegisterLoginInput } from "../../types/authentication/args/RegisterLoginInput";

export const validateRegisterInput = (registerInput: RegisterLoginInput) => {
  if (
    !registerInput.email.includes("@") ||
    !registerInput.email.includes(".")
  ) {
    return {
      message: "Invalid email",
      errors: [{ field: "email", message: "Email invalid" }],
    };
  }

  if (registerInput.password.length < 8) {
    return {
      message: "Invalid password",
      errors: [
        {
          field: "password",
          message: "Password length must be equal or greater than 8",
        },
      ],
    };
  }

  return null;
};
