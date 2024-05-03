import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import Popup from "reactjs-popup";
import useWebSocket, { ReadyState } from "react-use-websocket";
import {
  ClipboardOutline,
  CheckmarkSharp,
  SettingsOutline,
  AddCircleOutline,
  InformationCircleOutline,
} from "react-ionicons";
import { CopyToClipboard } from "react-copy-to-clipboard";

import { AuthContext } from "../../../contexts/Auth.Context";
import { ClassroomsContext } from "../../../contexts/Classrooms.Context";

import Dashboard from "../../../components/teacher/Dashboard";

import useWindowSize from "../../../utils/windowSize";
import CustomPopup from "../../../utils/CustomPopup";

const Classroom = () => {
  const router = useRouter();
  const size = useWindowSize();
  const { auth, setAuth, getAccessToken } = useContext(AuthContext);
  const { classrooms, setClassrooms } = useContext(ClassroomsContext);

  const [classroom, setClassroom] = useState();
  const [tasks, setTasks] = useState([]);
  const [announcements, setAnnouncements] = useState();
  const [resources, setResources] = useState();
  const [submissionStatuses, setSubmissionStatuses] = useState();
  const [submissions, setSubmissions] = useState();
  const [names, setNames] = useState();

  const [loadingAddStudent, setLoadingAddStudent] = useState(false);

  const [wsURL, setWSURL] = useState(null);
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(wsURL, {
    onOpen: () => console.log("websocket opened"), // do not remove
    onMessage: (msg) => handleMessage(JSON.parse(msg.data)),
    shouldReconnect: () => false,
  });

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Connected",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Disconnected",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  useEffect(() => {
    const { code } = router.query;
    if (!code) return;

    if (auth.tokens) {
      setWSURL(
        process.env.NEXT_PUBLIC_BACKEND_WS_BASE +
          "ws/teacher/?token=" +
          auth.tokens.access +
          "&code=" +
          code
      );
    } else return;

    if (!classrooms) {
      // Get classrooms data if user went directly to classroom link
      getAccessToken().then((accessToken) => {
        axios
          .get(process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE + "core/classrooms/", {
            headers: { Authorization: "Bearer " + accessToken },
          })
          .then((res) => {
            setClassroom(res.data.filter((cr) => cr.code === code)[0]);
            setClassrooms(res.data);
          })
          .catch((res) => {
            console.log(res);
          });
      });
    } else {
      const classroom = classrooms.filter(
        (classroom) => classroom.code === code
      )[0];
      setClassroom(classroom);
    }

    // Get all task data
    getAccessToken().then((accessToken) => {
      axios
        .get(process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE + "core/tasks/", {
          headers: { Authorization: "Bearer " + accessToken },
          params: { code: code },
        })
        .then((res) => {
          setTasks(res.data);
        })
        .catch((res) => {
          console.log(res);
        });
    });

    // Get all announcement data
    getAccessToken().then((accessToken) => {
      axios
        .get(
          process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE + "core/announcements/",
          {
            headers: { Authorization: "Bearer " + accessToken },
            params: { code: code },
          }
        )
        .then((res) => {
          setAnnouncements(res.data);
        })
        .catch((res) => {
          console.log(res);
        });
    });

    // Get all resource data
    getAccessToken().then((accessToken) => {
      axios
        .get(
          process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE + "core/resource_section/",
          {
            headers: { Authorization: "Bearer " + accessToken },
            params: { code: code },
          }
        )
        .then((res) => {
          setResources(res.data);
        })
        .catch((res) => {
          console.log(res);
        });
    });
  }, [router.query, auth.tokens]);

  useEffect(() => {
    if (!classroom) return;

    // Get student profiles
    getAccessToken().then((accessToken) => {
      axios
        .get(process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE + "core/student_list/", {
          headers: { Authorization: "Bearer " + accessToken },
          params: { code: classroom.code },
        })
        .then((res) => {
          setNames(res.data);
        });
    });
  }, [classroom]);

  useEffect(() => {
    // get all submissions
    if (tasks && classroom && !submissions) {
      getAccessToken().then((accessToken) => {
        axios
          .get(
            process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE + "core/submissions/",
            {
              headers: { Authorization: "Bearer " + accessToken },
              params: { code: classroom.code },
            }
          )
          .then((res) => {
            setSubmissions(res.data);
          });
      });

      getAccessToken().then((accessToken) => {
        axios
          .get(
            process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE +
              "core/submission_status/",
            {
              headers: { Authorization: "Bearer " + accessToken },
              params: { code: classroom.code },
            }
          )
          .then((res) => {
            setSubmissionStatuses(res.data);
          });
      });
    }
  }, [tasks, classroom, submissions]);

  const handleMessage = (msg) => {
    if (Object.keys(msg)[0] === "submission") {
      setSubmissions([
        ...submissions.filter((sub) => sub.id !== msg.submission.id),
        msg.submission,
      ]);
    } else if (Object.keys(msg)[0] === "submission_status") {
      setSubmissionStatuses([
        ...submissionStatuses.filter(
          (status) => status.id !== msg.submission_status.id
        ),
        msg.submission_status,
      ]);
    } else if (Object.keys(msg)[0] === "student_list") {
      setNames([
        ...names.filter(
          (name) => name.studentIndex !== msg.student_list.studentIndex
        ),
        msg.student_list,
      ]);
      let newClassroom = {
        ...classroom,
        student_indexes: classroom.student_indexes.concat([
          msg.student_list.studentIndex,
        ]),
      };
      setClassroom(newClassroom);
      setClassrooms([
        ...classrooms.filter((cr) => cr.id !== newClassroom.id),
        newClassroom,
      ]);
    }
  };

  const changeStatus = () => {
    const newClassroom = {
      ...classroom,
      status: classroom.status === 1 ? 2 : 1,
    };
    updateClassroom(newClassroom);
  };

  const removeIndex = (index) => {
    const newClassroom = {
      ...classroom,
      student_indexes: classroom.student_indexes.filter(
        (i) => i !== parseInt(index)
      ),
    };
    updateClassroom(newClassroom);
  };

  const addStudent = (name) => {
    // New student will have the largest index number
    let newIndex = 1;
    if (classroom.student_indexes.length > 0) {
      newIndex = Math.max(...classroom.student_indexes) + 1;
    }
    const newClassroom = {
      ...classroom,
      student_indexes: [...classroom.student_indexes, newIndex],
    };
    setNames([...names, { index: newIndex, name }]);
    updateClassroom(newClassroom);
  };

  const bulkAddStudents = (rawNames) => {
    const newIndexes = [...Array(rawNames.length).keys()].map(
      (i) => i + 1 + Math.max(...classroom.student_indexes)
    );
    const newClassroom = {
      ...classroom,
      student_indexes: [...classroom.student_indexes, ...newIndexes],
    };
    const newNames = newIndexes.map((index, i) => ({
      index,
      name: rawNames[i],
    }));

    setNames([...names, ...newNames]);
    updateClassroom({ ...newClassroom, newNames });
  };

  const updateClassroom = (newClassroom) => {
    getAccessToken().then((accessToken) => {
      axios
        .put(
          process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE +
            "core/classrooms/" +
            newClassroom.id +
            "/",
          newClassroom,
          {
            headers: { Authorization: "Bearer " + accessToken },
          }
        )
        .then((res) => {
          setClassroom(res.data);
          setClassrooms([
            ...classrooms.filter((cr) => cr.id !== res.data.id),
            res.data,
          ]);
          // setLoadingAddStudent(false)
        });
    });
  };

  const updateName = (index, name, id) => {
    getAccessToken().then((accessToken) => {
      axios
        .put(
          process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE +
            "core/student_list/" +
            classroom.id +
            "/",
          {
            code: classroom.code,
            index,
            name,
          },
          {
            headers: { Authorization: "Bearer " + accessToken },
          }
        )
        .then((res) => {
          let newName = names.filter((n) => n.index === index)[0];
          newName.name = name;
          setNames([...names.filter((n) => n.index !== index), newName]);
        });
    });
  };

  const updateClassName = (classroomName) => {
    getAccessToken().then((accessToken) => {
      axios
        .put(
          process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE +
            "core/classrooms/" +
            classroom.id +
            "/",
          {
            name: classroomName,
            student_indexes: classroom.student_indexes,
            status: classroom.status,
            teacher: classroom.teacher,
          },
          {
            headers: { Authorization: "Bearer " + accessToken },
          }
        )
        .then((res) => {
          console.log("Success");
        })
        .catch((res) => {
          console.log(res);
        });
    });
  };

  const deleteClass = (id) => {
    getAccessToken().then((accessToken) => {
      axios
        .delete(
          process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE +
            "core/classrooms/" +
            id +
            "/",
          { headers: { Authorization: "Bearer " + accessToken } }
        )
        .then((res) => {
          setClassrooms(classrooms.filter((cr) => cr.id !== id));
        });
    });
  };

  const handleGoBack = () => {
    router.push("/teacher");
  };

  const statusColor = {
    Connecting: "text-yellow-600",
    Connected: "text-green-600",
    Disconnected: "text-red-600",
  };
  const statusHexColor = {
    Connecting: "#D97706",
    Connected: "#059669",
    Disconnected: "#DC2626",
  };

  return (
    <div>
      <Head>
        <title>Teacher | Tinkerfolio</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/mini_logo.ico" />
        <style>{`\
                    .blinking\
                    {\
                        animation:blinkingText 3s infinite;\
                    }\
                    @keyframes blinkingText{\
                        0% {color: ${statusHexColor[connectionStatus]}}\
                        49% {color: ${statusHexColor[connectionStatus]}}\
                        70% {color: transparent}\
                        99% {color:transparent}\
                        100% {color: ${statusHexColor[connectionStatus]}}\
                    }\
                `}</style>
      </Head>

      {classroom && (
        <div className="flex flex-col">
          <div
            className="fixed w-full flex flex-row gap-4 items-center bg-gray-600 py-1 px-4 sm:px-4"
            style={{ marginTop: "70px" }}
          >
            <div className="flex flex-row items-center py-1 px-2 rounded bg-gray-500 hover:bg-gray-400 cursor-pointer">
              <button className="text-white px-2 py-1" onClick={handleGoBack}>
                Back
              </button>
            </div>
            <EditableClassName
              text={classroom.name}
              classroomID={classroom.id}
              updateClassName={updateClassName}
            />
            <div className="flex flex-row justify-self-end py-1 px-2 rounded bg-gray-500 hover:bg-gray-400 cursor-pointer">
              <AddCircleOutline
                color="#ffffff"
                height="20px"
                width="20px"
              />
              <p className="text-sm text-white pl-2"><Link href={"/teacher/bulk/" + classroom.code}>Create and Add Students</Link></p>
            </div>
            <StudentJoinInfo code={classroom.code} />
            <SettingsMenu {...{ classroom, changeStatus, deleteClass }} />
          </div>
          <div className="bg-white" style={{ marginTop: "22px" }}>
            <Dashboard
              {...{
                classrooms,
                classroom,
                removeIndex,
                addStudent,
                bulkAddStudents,
                loadingAddStudent,
                setLoadingAddStudent,
                names,
                updateName,
                tasks,
                setTasks,
                submissionStatuses,
                submissions,
                setSubmissions,
                sendJsonMessage,
                size,
                announcements,
                setAnnouncements,
                resources,
                setResources,
              }}
            />
          </div>
          <div
            className={`fixed bottom-4 right-4 flex flex-row items-center py-1 px-4 rounded-full bg-white shadow-lg ${statusColor[connectionStatus]}`}
          >
            <p className="blinking pr-2">⬤</p>
            <p>{connectionStatus}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classroom;

const SettingsMenu = ({ classroom, changeStatus, deleteClass }) => {
  const [isCloseOnDocClick, setIsCloseOnDocClick] = useState(true);

  return (
    <Popup
      trigger={
        <div className="flex flex-row items-center py-1 px-2 rounded bg-gray-500 hover:bg-gray-400 cursor-pointer">
          <SettingsOutline color="#ffffff" height="20px" width="20px" />
          <p className="text-sm text-white pl-2">Settings</p>
        </div>
      }
      position="bottom right"
      arrow={false}
      closeOnDocumentClick={isCloseOnDocClick}
    >
      {(close) => (
        <div className="mt-4 px-4 py-4 w-72 bg-white shadow-lg rounded">
          <h2 className="text-gray-500 text-center">Settings</h2>
          <div className="flex mt-2 mb-4 border"></div>
          <div className="flex flex-row items-center">
            <p className="font-semibold">Status</p>
            <select
              className="ml-auto border py-0.5 px-2 rounded outline-none"
              value={classroom.status}
              onChange={changeStatus}
            >
              <option value={1}>Active</option>
              <option value={2}>Archive</option>
            </select>
          </div>
          <div className="flex flex-row items-center justify-center">
            <DeleteClass
              {...{
                classroom,
                deleteClass,
                menuClose: close,
                setIsCloseOnDocClick,
              }}
            />
          </div>
        </div>
      )}
    </Popup>
  );
};

const StudentJoinInfo = ({ code }) => {
  const [isCopied, setIsCopied] = useState(false);

  const hasCopied = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <Popup
      trigger={
        <div className="flex flex-row ml-auto items-center py-1 px-2 rounded bg-gray-500 hover:bg-gray-400 cursor-pointer">
          <InformationCircleOutline
            color="#ffffff"
            height="20px"
            width="20px"
          />
          <p className="text-sm text-white pl-2">Join Info for Students</p>
        </div>
      }
      modal
      overlayStyle={{ background: "rgba(0,0,0,0.4)" }}
    >
      {(close) => (
        <div className="flex flex-col px-4 py-4 bg-white rounded-lg shadow-md">
          <div className="flex flex-row items-center justify-center">
            <h1 className="text-lg sm:text-xl text-center">
              Join with this code:
            </h1>
          </div>
          <div className="flex flex-row items-center justify-center mt-4">
            <p className="font-mono text-5xl sm:text-7xl tracking-widest text-white py-2 px-2 bg-black ml-1">
              {code}
            </p>
            {isCopied ? (
              <CheckmarkSharp
                color={"#10B981"}
                cssClasses="ml-2"
                height="45px"
                width="45px"
              />
            ) : (
              <CopyToClipboard
                className="cursor-pointer"
                text={code}
                onCopy={hasCopied}
              >
                <ClipboardOutline
                  beat
                  cssClasses="ml-2"
                  height="45px"
                  width="45px"
                />
              </CopyToClipboard>
            )}
          </div>
        </div>
      )}
    </Popup>
  );
};

const ClassCode = ({ code }) => {
  const [isCopied, setIsCopied] = useState(false);

  const hasCopied = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <Popup
      trigger={
        <div className="mt-4 sm:mt-10 ml-2 text-lg rounded-lg">
          <div>
            <p className="text-base text-center font-bold text-lg text-gray-500">
              For Students
            </p>
          </div>
          <div>
            <p className="text-center py-1 font-mono font-bold bg-blue text-black rounded cursor-pointer border-2 text-2xl border-blue-300 hover:bg-blue-300">
              {code}
            </p>
          </div>
        </div>
      }
      modal
      overlayStyle={{ background: "rgba(0,0,0,0.4)" }}
    >
      {(close) => (
        <div className="flex flex-col px-4 py-4 bg-white rounded-lg shadow-md">
          <div className="flex flex-row items-center justify-center">
            <h1 className="text-lg sm:text-xl text-center">
              Join with this code:
            </h1>
          </div>
          <div className="flex flex-row items-center justify-center mt-4">
            <p className="font-mono text-5xl sm:text-7xl tracking-widest text-white py-2 px-2 bg-black ml-1">
              {code}
            </p>
            {isCopied ? (
              <CheckmarkSharp
                color={"#10B981"}
                cssClasses="ml-2"
                height="45px"
                width="45px"
              />
            ) : (
              <CopyToClipboard
                className="cursor-pointer"
                text={code}
                onCopy={hasCopied}
              >
                <ClipboardOutline
                  beat
                  cssClasses="ml-2"
                  height="45px"
                  width="45px"
                />
              </CopyToClipboard>
            )}
          </div>
        </div>
      )}
    </Popup>
  );
};

const EditableClassName = ({
  text,
  classroomID,
  updateClassName,
  ...props
}) => {
  const [isEditing, setEditing] = useState(false);
  const [value, setValue] = useState(text);
  const childRef = useRef();

  //auto focus on input element when editing mode is enabled
  useEffect(() => {
    if (childRef && childRef.current && isEditing === true) {
      childRef.current.focus();
    }
  }, [isEditing, childRef]);

  //exit editor when enter/esc key is pressed
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === "Escape") {
      event.target.blur();
    }
  };

  const onBlur = () => {
    setEditing(false);
    updateClassName(value);
  };

  const onFocus = (event) => event.target.select();

  return (
    <section {...props}>
      {isEditing ? (
        //editing mode enabled
        <div onBlur={() => onBlur()} onKeyDown={(e) => handleKeyDown(e)}>
          <input
            ref={childRef}
            type="text"
            name="classroom name"
            value={value}
            onFocus={onFocus}
            onChange={(e) => setValue(e.target.value)}
            className="text-xl text-gray-700 font-bold text-justify px-2 py-0.5 rounded-lg"
            style={{ width: `${value.length + 1.25}ch` }}
          />
        </div>
      ) : (
        //editing mode disabled
        <div onClick={() => setEditing(true)}>
          <h1 className="text-xl font-bold px-2 py-0.5 rounded-lg bg-gray-500 text-white cursor-pointer hover:bg-gray-400">
            {value}
          </h1>
        </div>
      )}
    </section>
  );
};

const DeleteClass = ({
  classroom,
  deleteClass,
  setIsCloseOnDocClick,
  menuClose,
}) => {
  return (
    <CustomPopup
      trigger={
        <p className="font-base bg-transparent border border-red-400 text-red-500 px-2 w-4/5 my-4 hover:bg-red-100 rounded text-center cursor-pointer">
          Delete Class
        </p>
      }
      onOpen={() => setIsCloseOnDocClick(false)}
      onClose={() => setIsCloseOnDocClick(true)}
    >
      {(close) => (
        <div className="flex flex-col px-6 py-8 bg-white rounded-lg w-56 sm:w-80">
          <h1 className="text-xl font-semibold text-center">Are you sure?</h1>
          <p className="text-gray-500 mt-2">
            This classroom and its students, tasks, and submissions cannot be
            recovered.
          </p>
          <div className="flex flex-col mt-4">
            <Link href="/teacher">
              <button
                className="focus:outline-none px-2 py-1 border border-red-300 text-red-500 hover:bg-red-100 hover:border-red-500 hover:text-red-700 rounded mb-2"
                onClick={() => {
                  deleteClass(classroom.id);
                  close();
                  menuClose();
                }}
              >
                Delete
              </button>
            </Link>

            <button
              className="focus:outline-none px-2 py-1 border border-gray-300 hover:bg-gray-100 hover:border-gray-400 rounded"
              onClick={() => {
                close();
                menuClose();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </CustomPopup>
  );
};
