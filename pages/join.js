import Head from "next/head";
import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import SyncLoader from "react-spinners/SyncLoader";

import { AuthContext } from "../contexts/Auth.Context";

const StudentLogin = () => {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true); // to show login or signup frames

  const { auth, setAuth } = useContext(AuthContext);
  const [code, setCode] = useState();
  const [index, setIndex] = useState();
  const [name, setName] = useState();
  const [loginFailed, setLoginFailed] = useState();

  const [loginDetails, setLoginDetails] = useState(false); // show login details after sign-up

  const [invalidInput, setInvalidInput] = useState(false);

  const loginUser = (e) => {
    e.preventDefault();
    // Validation
    if ((code.length !== 6) | isNaN(index)) {
      setLoginFailed(true);
      return;
    }

    setAuth({ ...auth, loading: true });

    console.log("ran");
    axios
      .post(
        process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE + "/auth/token/",
        {
          username: code + "_" + index,
          password: index,
        },
        { headers: { "Content-Type": "application/json" } }
      )
      .then((res) => {
        setAuth({
          loading: false,
          isAuthenticated: true,
          tokens: res.data,
          userType: "student",
        });
      })
      .catch((res) => {
        console.log("login failed");
        setAuth({ ...auth, loading: false });
        setLoginFailed(true);
      });
  };

  const signupUser = (e) => {
    e.preventDefault();
    // Validation
    if ((code.length !== 6) | (name.length === 0)) {
      setLoginFailed(true);
      return;
    }

    setAuth({ ...auth, loading: true });

    console.log("ran");
    axios
      .post(
        process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE +
          "/auth/token/student_register/",
        {
          code,
          name,
        },
        { headers: { "Content-Type": "application/json" } }
      )
      .then((res) => {
        setLoginDetails(res.data);
        setIsLogin(true);
        setAuth({ ...auth, loading: false });
      })
      .catch((res) => {
        console.log("signup failed");
        setAuth({ ...auth, loading: false });
      });
  };

  useEffect(() => {
    if (auth.isAuthenticated) router.push("/student/");
  }, [auth]);

  return (
    <div>
      <Head>
        <title>Join Classroom | EchoClass</title>
        <meta name="description" content="Generated by create next app" />
      </Head>

      <main className="flex flex-col items-center pt-8 px-4 bg-white">
        {invalidInput && (
          <p className="py-2 px-2 border-2 border-red-500 rounded-lg font-bold text-red-500">
            Invalid inputs.
          </p>
        )}

        {isLogin ? (
          <div className="">
            <h1 className="text-2xl sm:text-4xl my-6 font-bold text-blue-700 text-center">
              Login to Classroom
            </h1>

            {loginDetails !== false && (
              <div className="flex flex-col bg-gray-800 rounded px-4 py-4 mb-6">
                <h3 className="text-xl font-bold text-blue-200">
                  Sign-up Successful!
                </h3>
                <p className="mt-1 text-gray-200">
                  Please remember your login credentials below.
                </p>
                <div className="flex flex-row items-center mt-6 text-gray-300 text-sm">
                  <p>Classroom Code</p>{" "}
                  <p className="ml-auto font-mono text-2xl font-bold text-white">
                    {loginDetails.code}
                  </p>
                </div>
                <div className="flex flex-row items-center mt-1 text-gray-300 text-sm">
                  <p>Index</p>{" "}
                  <p className="ml-auto font-mono text-2xl font-bold text-white">
                    {loginDetails.index}
                  </p>
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                {
                  e.preventDefault();
                  loginUser(e);
                }
              }}
              className=""
            >
              <label>
                <h2 className="font-semibold text-lg pb-0.5">Classroom Code</h2>
                <input
                  className="outline-none border-b-2 text-xl sm:text-3xl"
                  type="text"
                  name="code"
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <label>
                <h2 className="font-semibold text-lg pt-4 pb-0.5">Index</h2>
                <input
                  className="outline-none border-b-2 text-xl sm:text-3xl"
                  type="text"
                  name="index"
                  onChange={(e) => setIndex(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <br />
              {loginFailed && (
                <p className="text-red-500 mt-2 text-sm">
                  Invalid code or index.
                </p>
              )}
              {auth.loading ? (
                <div
                  className="flex flex-row justify-center bg-blue-500 mt-4 py-1 px-2 rounded-md w-full"
                  style={{ height: "36px" }}
                >
                  <SyncLoader color={"#ffffff"} size={8} margin={1} />
                </div>
              ) : (
                <>
                  <button className="bg-blue-500 hover:bg-blue-600 border border-blue-500 hover:border-blue-600 text-white text-lg mt-4 py-1 px-2 rounded-md w-full">
                    Login
                  </button>
                  <button
                    className="focus:outline-none border border-blue-500 hover:border-blue-700 text-blue-500 hover:text-blue-700 text-lg mt-4 py-1 px-2 rounded-md w-full"
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    I don't have an index number.
                  </button>
                </>
              )}
            </form>
          </div>
        ) : (
          <>
            <h1 className="text-2xl sm:text-4xl my-6 font-bold text-blue-700">
              Sign Up for Classroom
            </h1>

            <form
              onSubmit={(e) => {
                {
                  e.preventDefault;
                  signupUser(e);
                }
              }}
              className=""
            >
              <label>
                <h2 className="font-semibold text-lg pb-0.5">Classroom Code</h2>
                <input
                  className="outline-none border-b-2 text-xl sm:text-3xl"
                  type="text"
                  name="code"
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <label>
                <h2 className="font-semibold text-lg pt-4 pb-0.5">Full Name</h2>
                <input
                  className="outline-none border-b-2 text-xl sm:text-3xl"
                  type="text"
                  name="index"
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <br />
              {loginFailed && (
                <p className="text-red-500 mt-2 text-sm">
                  Invalid code or name.
                </p>
              )}
              {auth.loading ? (
                <div
                  className="flex flex-row justify-center bg-blue-500 mt-4 py-1 px-2 rounded-md w-full"
                  style={{ height: "36px" }}
                >
                  <SyncLoader color={"#ffffff"} size={8} margin={1} />
                </div>
              ) : (
                <>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 border border-blue-500 hover:border-blue-600 text-white text-lg mt-4 py-1 px-2 rounded-md w-full"
                  >
                    Sign Up
                  </button>
                  <button
                    className="focus:outline-none border border-blue-500 hover:border-blue-700 text-blue-500 hover:text-blue-700 text-lg mt-4 py-1 px-2 rounded-md w-full"
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    I already have an index number.
                  </button>
                </>
              )}
            </form>
          </>
        )}
      </main>

      <footer></footer>
    </div>
  );
};

export default StudentLogin;
