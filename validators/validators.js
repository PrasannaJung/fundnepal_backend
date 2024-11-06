const z = require("zod");

const signupSchema = z.object({
  username: z.string({
    required_error: "Username is required!",
    invalid_type_error: "Username must be a string!",
  }),
  email: z
    .string({
      required_error: "Email is required!",
    })
    .email(),
  phone: z
    .string()
    .length(10, { message: "Phone number must be exactly 10 characters long" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d_]+$/, {
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and only alphanumeric characters or underscores",
    }),
});

const loginSchema = z.object({
  email: z
    .string({
      required_error: "Email is required!",
    })
    .email(),
  password: z.string({
    required_error: "Password is required!",
    invalid_type_error: "Password must be a string!",
  }),
});

module.exports = {
  signupSchema,
  loginSchema,
};
