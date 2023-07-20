import { useState, useEffect, useContext } from "react";
import axios from "axios";
import Popup from "reactjs-popup";
import CustomPopup from "../../utils/CustomPopup";
import CustomLinkify from "../../utils/CustomLinkify";
import Resources from "./Resources";
import Announcements from "./Announcements";

import { AuthContext } from "../../contexts/Auth.Context";

import {
  Filter as FilterIcon,
  AddCircleOutline,
  FunnelOutline,
  MegaphoneOutline,
  ChevronBackOutline,
  ArrowBackOutline,
  ArrowForwardOutline,
  DocumentTextOutline,
  Trash,
} from "react-ionicons";

const contentStyle = { paddingLeft: "0.5rem", paddingRight: "0.5rem" };
const arrowStyle = { color: "#374151", paddingBottom: "0.25rem" }; // style for an svg element

const Dashboard = ({
  classrooms,
  classroom,
  names,
  removeIndex,
  addStudent,
  bulkAddStudents,
  loadingAddStudent,
  setLoadingAddStudent,
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
}) => {
  const { getAccessToken } = useContext(AuthContext);
  const [tableNames, setTableNames] = useState();
  const [sortBy, setSortBy] = useState("indexLowToHigh");
  const [sortTasksBy, setSortTasksBy] = useState("publishOldToNew");
  const [showAnnouncements, setShowAnnouncements] = useState(false);

  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);

  const [showNewTask, setShowNewTask] = useState(true);
  const [showDraftsMenu, setShowDraftsMenu] = useState(false);
  const [showImportTask, setShowImportTask] = useState(false);

  const [importMenuTaskList, setImportMenuTaskList] = useState([]);
  const [tasksIDToImport, setTasksIDToImport] = useState([]);

  const changeNewTaskPage = (currentPage) => {
    if (showNewTask) setShowNewTask(false);
    if (showDraftsMenu) setShowDraftsMenu(false);
    if (showImportTask) setShowImportTask(false);

    switch (currentPage) {
      case "newTask":
        setShowNewTask(true);
        break;
      case "draftsMenu":
        setShowDraftsMenu(true);
        break;
      case "importTask":
        setShowImportTask(true);
    }
  };

  const [tasksToHide, setTasksToHide] = useState(() => {
    const saved = localStorage.getItem("tasksToHide" + classroom.code);
    let initial = [];
    if (saved !== null && saved !== undefined && saved !== "")
      initial = JSON.parse(saved);
    return initial;
  });

  useEffect(() => {
    setTableNames(names);
  }, [names]);

  useEffect(() => {
    setLoadingAddStudent(false);
  }, [tableNames]);

  if (!tableNames) return <h1></h1>;

  const setOneTask = (newTask) => {
    if (newTask !== tasks.find((t) => t.id === newTask.id)) {
      // if task has been edited
      getAccessToken().then((accessToken) => {
        axios
          .put(
            process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE +
              "core/tasks/" +
              newTask.id.toString() +
              "/",
            newTask,
            {
              headers: { Authorization: "Bearer " + accessToken },
            }
          )
          .then((res) => {
            setTasks([...tasks.filter((t) => t.id !== res.data.id), res.data]);
          });
      });
    }
  };

  const addTask = (task) => {
    getAccessToken().then((accessToken) => {
      axios
        .post(
          process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE + "core/tasks/",
          { code: classroom.code, ...task },
          { headers: { Authorization: "Bearer " + accessToken } }
        )
        .then((res) => {
          setTasks([...tasks, res.data]);
        });
    });
  };

  const addImportedTask = (tasksArray) => {
    getAccessToken().then((accessToken) => {
      axios
        .post(
          process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE + "core/tasks/?bulk=true",
          tasksArray,
          { headers: { Authorization: "Bearer " + accessToken } }
        )
        .then((res) => {
          setTasks([...tasks, ...res.data]);
        });
      setImportMenuTaskList([]);
      setTasksIDToImport([]);
    });
  };

  const deleteTask = (id) => {
    getAccessToken().then((accessToken) => {
      axios
        .delete(
          process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE +
            "core/tasks/" +
            id.toString() +
            "/",
          { headers: { Authorization: "Bearer " + accessToken } }
        )
        .then((res) => {
          setTasks(tasks.filter((t) => t.id !== id));
        });
    });
  };

  const updateDraftTask = (task, draftTaskID) => {
    getAccessToken().then((accessToken) => {
      axios
        .put(
          process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE +
            "core/tasks/" +
            draftTaskID.toString() +
            "/",
          {
            name: task.name,
            status: 1,
            description: task.description,
            max_stars: 5,
            display: task.display,
          },
          {
            headers: { Authorization: "Bearer " + accessToken },
          }
        )
        .then((res) => {
          setTasks(tasks.map((t) => (t.id !== draftTaskID ? t : res.data))); //update tasks array
        })
        .catch((res) => {
          console.log(res);
        });
    });
  };

  const fetchTasksFromClassroom = (code) => {
    getAccessToken().then((accessToken) => {
      axios
        .get(
          process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE +
            "core/tasks/?code=" +
            code.toString(),
          {
            headers: { Authorization: "Bearer " + accessToken },
          }
        )
        .then((res) => {
          const nonDraftTasks = res.data.filter((t) => t.display !== 2);
          setImportMenuTaskList(nonDraftTasks);
        })
        .catch((res) => {
          console.log(res);
        });
    });
  };

  const addReview = (id, stars, comment, setSubmission) => {
    // push review to server
    getAccessToken().then((accessToken) => {
      axios
        .put(
          process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE +
            "core/submissions/" +
            id.toString() +
            "/",
          { stars, comment },
          { headers: { Authorization: "Bearer " + accessToken } }
        )
        .then((res) => {
          if (!res.data.hasOwnProperty("image")) {
            // If not, add the image property to the response data manually
            res.data.image = submissions.find((s) => s.id === id)?.image;
          }

          // Update the submissions state with the new review data, preserving the image property
          const updatedSubmissions = submissions.map((sub) => {
            if (sub.id === id) {
              return { ...sub, stars, comment, image: res.data.image };
            }
            return sub;
          });

          // Update the state with the new submissions data
          setSubmissions(updatedSubmissions);

          // Update the submission state separately (if needed)
          setSubmission(res.data);
        });
    });

    // add stars to student's score
    const studentID = submissions.filter((sub) => sub.id === id)[0].student;
    let name = tableNames.filter((name) => name.studentUserID === studentID)[0];
    name.score += stars;
    setTableNames([
      ...tableNames.filter((name) => name.studentUserID !== studentID),
      name,
    ]);
  };

  const sortedTasks = () => tasks.sort((a, b) => (a.id > b.id ? 1 : -1));

  const shownTasks = () => {
    let tasksProgress = tasks.filter(
      (task) => !tasksToHide.includes(task.id) && task.display === 1
    );

    switch (sortTasksBy) {
      case "publishOldToNew":
        tasksProgress.sort((a, b) =>
          a.published_at > b.published_at ? 1 : -1
        );
        break;
      case "publishNewToOld":
        tasksProgress.sort((a, b) =>
          a.published_at < b.published_at ? 1 : -1
        );
        break;
    }

    return tasksProgress;
  };

  const sortedStudents = () => names.sort((a, b) => (a.id > b.id ? 1 : -1));

  const sortTableTasks = () => {
    let tasksToShow = tasks.filter(
      (task) => !tasksToHide.includes(task.id) && task.display === 1
    );

    switch (sortTasksBy) {
      case "publishOldToNew":
        tasksToShow.sort((a, b) => (a.published_at > b.published_at ? 1 : -1));
        break;
      case "publishNewToOld":
        tasksToShow.sort((a, b) => (a.published_at < b.published_at ? 1 : -1));
        break;
    }
    return tasksToShow;
  };

  const sortStudentIndex = () => {
    let sortedTableNames = null;

    switch (sortBy) {
      case "indexLowToHigh":
        sortedTableNames = tableNames.sort((a, b) =>
          a.studentIndex > b.studentIndex ? 1 : -1
        );
        break;
      case "indexHightoLow":
        sortedTableNames = tableNames.sort((a, b) =>
          a.index < b.index ? 1 : -1
        );
        break;
      case "starsHighToLow":
        sortedTableNames = tableNames.sort((a, b) => {
          if (a.score < b.score) return 1;
          else if (a.score > b.score) return -1;
          else {
            if (a.studentIndex > b.studentIndex) return 1;
            else return -1;
          }
        });
        break;
      case "starsLowToHigh":
        sortedTableNames = tableNames.sort((a, b) => {
          if (a.score < b.score) return -1;
          else if (a.score > b.score) return 1;
          else {
            if (a.studentIndex > b.studentIndex) return 1;
            else return -1;
          }
        });
        break;
    }

    return sortedTableNames.map((n, i) => n.studentIndex);
  };

  // disabling add student when its loading is still not working
  return (
    <>
      <div style={{ height: "96px" }}></div>

      {showAnnouncements ? (
        <>
          <div className="flex flex-row py-4 px-8 bg-gray-100 shadow-md w-full fixed">
            <button
              className="flex flex-row py-1 px-2 bg-red-600 text-sm text-white rounded focus:outline-none hover:bg-red-700"
              onClick={() => setShowAnnouncements(false)}
            >
              <ChevronBackOutline
                color={"#00000"}
                title={"Back"}
                height="20px"
                width="20px"
              />
              <p className="pl-1">Back</p>
            </button>
          </div>
          <div
            className="grid grid-cols-2 px-8 py-8 gap-20"
            style={{
              height: size.height - 173,
              borderSpacing: "50px",
              marginTop: "60px",
            }}
          >
            <Announcements
              classroom={classroom}
              announcements={announcements}
              setAnnouncements={setAnnouncements}
            />
            <Resources
              classroom={classroom}
              resources={resources}
              setResources={setResources}
            />
          </div>
        </>
      ) : (
        <>
          <div className="py-4 px-8 bg-gray-100 shadow-md w-full fixed grid grid-cols-2">
            <div className="flex flex-row flex-wrap gap-4">
              <Filter {...{ tasks, tasksToHide, setTasksToHide, classroom }} />
              <Sort {...{ sortBy, setSortBy, sortTasksBy, setSortTasksBy }} />
              <button
                onClick={() => {
                  changeNewTaskPage("newTask");
                  setNewTaskModalOpen(true);
                }}
                className="flex flex-row py-1 px-2 bg-red-600 text-sm text-white rounded hover:bg-red-700 focus:outline-none"
              >
                <AddCircleOutline
                  color={"#00000"}
                  title={"Add"}
                  height="20px"
                  width="20px"
                />
                <p className="pl-1">Task</p>
              </button>
              <NewTask
                {...{
                  classroom,
                  classrooms,
                  addTask,
                  deleteTask,
                  updateDraftTask,
                  tasks,
                  changeNewTaskPage,
                  showNewTask,
                  setShowNewTask,
                  showDraftsMenu,
                  setShowDraftsMenu,
                  showImportTask,
                  setShowImportTask,
                  newTaskModalOpen,
                  setNewTaskModalOpen,
                  fetchTasksFromClassroom,
                  importMenuTaskList,
                  setImportMenuTaskList,
                  tasksIDToImport,
                  setTasksIDToImport,
                  addImportedTask,
                }}
              />
            </div>
            <div className="flex flex-row justify-end gap-4">
              <button
                onClick={() => {
                  changeNewTaskPage("draftsMenu");
                  setNewTaskModalOpen(true);
                }}
                className="flex flex-row py-1 px-2 bg-gray-600 text-sm text-white rounded hover:bg-gray-700 focus:outline-none"
              >
                <DocumentTextOutline
                  color={"#00000"}
                  title={"Drafts"}
                  height="20px"
                  width="20px"
                />
                <p className="pl-1">
                  Drafts ({tasks.filter((t) => t.display === 2).length})
                </p>
              </button>{" "}
              <button
                className="flex flex-row py-1 px-2 bg-gray-600 text-sm text-white rounded focus:outline-none hover:bg-gray-700"
                onClick={() => setShowAnnouncements(true)}
              >
                <MegaphoneOutline
                  color={"#00000"}
                  title={"Announcements"}
                  height="20px"
                  width="20px"
                />
                <p className="pl-1">Announcements</p>
              </button>
            </div>
          </div>

          {/* TABLE */}
          <table
            className="block overflow-y-auto px-8 py-8 w-max min-w-full"
            style={{
              height: size.height - 173,
              borderSpacing: "50px",
              marginTop: "60px",
            }}
          >
            {/* Table headers */}
            <thead>
              <tr className="border-2">
                <th className="border-r-2 px-2 py-2 w-16">
                  <p>Index</p>
                </th>
                <th className="border-r-2 px-2 py-2 w-72">
                  <p>Student</p>
                </th>
                <th className="border-r-2 px-2 py-2 w-16">
                  <p className="text-xl">★</p>
                </th>
                {sortTableTasks().map((task, i) => (
                  <th
                    className="border-r-2 px-2 py-2"
                    key={i}
                    style={{ width: "200px" }}
                  >
                    {/* this image below is a quick fix to give HTML table a min-width property. DO NOT DELETE */}
                    <img
                      style={{
                        float: "left",
                        minWidth: "200px",
                        visibility: "hidden",
                        width: "0px",
                      }}
                    />
                    <div className="flex flex-row items-center">
                      <p className="font-normal ml-1 mr-2 py-0.5 px-1 text-sm text-white bg-gray-700 rounded">
                        Task
                      </p>
                      <p
                        className="truncate text-left"
                        style={{ width: "150px" }}
                      >
                        {task.name} {task.is_group ? "(Group)" : "(Individual)"}
                      </p>
                      <TaskSummary
                        {...{
                          submissions,
                          submissionStatuses,
                          task,
                          sortedStudents,
                          names,
                        }}
                      />
                      <TaskMenu
                        {...{
                          task,
                          setOneTask,
                          deleteTask,
                          submissions,
                          tasksToHide,
                          setTasksToHide,
                          classroom,
                        }}
                      />
                    </div>
                    <TaskSubmissionsBar
                      {...{
                        submissions,
                        submissionStatuses,
                        task,
                        sortedStudents,
                        names,
                      }}
                    />
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="align-top">
              {/* map for each student */}
              {sortStudentIndex().map((index, i) => {
                const sp = tableNames.filter(
                  (tn) => tn.studentIndex === index
                )[0];
                if (typeof sp === "undefined") return;
                const student_id = sp.studentUserID;

                return (
                  <tr className="border-2" key={i}>
                    <td className="border-r-2 px-2 py-2 w-16">
                      <p>{index}</p>
                    </td>

                    <td className="border-r-2 px-2 py-2 w-72">
                      <div className="flex flex-row">
                        {/* student name panel */}
                        <StudentName
                          {...{
                            index,
                            tableNames,
                          }}
                        />
                        <StudentMenu index={index} removeIndex={removeIndex} />
                      </div>
                      <p className="mt-4 text-sm text-gray-700">Submissions</p>
                      <SubmissionSummary
                        {...{
                          student_id,
                          tasks,
                          sortedTasks,
                          shownTasks,
                          submissions,
                          submissionStatuses,
                        }}
                      />
                    </td>
                    <td className="border-r-2 px-2 py-2 text-center w-16">
                      {sp.score}
                    </td>

                    {submissions &&
                      sortTableTasks().map((task, i) => {
                        let sub = submissions.filter(
                          (s) => s.task === task.id && s.student === student_id
                        )[0];
                        return sub ? (
                          <Submission
                            {...{
                              submissions,
                              sub,
                              tableNames,
                              sp,
                              task,
                              addReview,
                              sendJsonMessage,
                              submissionStatuses,
                            }}
                            key={i}
                          />
                        ) : (
                          // if no submission, show empty cell
                          <td
                            className="px-2 py-2 border-r-2"
                            key={i}
                            style={{ width: "241.36px" }}
                          >
                            {submissionStatuses?.filter(
                              (s) =>
                                s.student === student_id && s.task === task.id
                            )[0]?.status === 1
                              ? "Not Started❗️"
                              : submissionStatuses?.filter(
                                  (s) =>
                                    s.student === student_id &&
                                    s.task === task.id
                                )[0]?.status === 2
                              ? "Working On It❗️"
                              : submissionStatuses?.filter(
                                  (s) =>
                                    s.student === student_id &&
                                    s.task === task.id
                                )[0]?.status === 3
                              ? "Stuck❗️"
                              : ""}
                          </td>
                        );
                      })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </>
  );
};

export default Dashboard;

const Filter = ({ tasks, tasksToHide, setTasksToHide, classroom }) => {
  const trackSettings = (newSettings) => {
    localStorage.setItem(
      "tasksToHide" + classroom.code,
      JSON.stringify(newSettings)
    );
  };

  const handleCheck = (raw_id) => {
    const id = parseInt(raw_id);
    if (tasksToHide.includes(id)) {
      setTasksToHide(tasksToHide.filter((t) => t != id));
      trackSettings(tasksToHide.filter((t) => t != id));
    } else {
      setTasksToHide([...tasksToHide, id]);
      trackSettings([...tasksToHide, id]);
    }
  };

  return (
    <Popup
      trigger={
        <button className="flex flex-row py-1 px-2 bg-gray-500 text-sm text-white rounded hover:bg-gray-700 focus:outline-none">
          <FilterIcon color={"#ffffff"} height="20px" width="20px" />
          <p className="pl-2">
            Hide/Show Tasks (
            {tasks.filter((t) => t.display === 1).length - tasksToHide.length})
          </p>
        </button>
      }
      position="bottom left"
      arrow={false}
      contentStyle={{ paddingTop: "0.5rem" }}
    >
      {(close) => (
        <div className="px-4 py-4 bg-white shadow-md rounded w-2/5 min-w-300px">
          <p className="text-xl font-bold mb-0.5">Tasks</p>
          <div className="flex flex-row items-center mb-4 text-sm">
            <p
              className="text-red-600 hover:underline cursor-pointer"
              onClick={() => {
                setTasksToHide([]);
                trackSettings([]);
              }}
            >
              Select All
            </p>
            <p className="mx-2">|</p>
            <p
              className="text-red-600 hover:underline cursor-pointer"
              onClick={() => {
                setTasksToHide(tasks.map((t) => t.id));
                trackSettings(tasks.map((t) => t.id));
              }}
            >
              Unselect All
            </p>
          </div>
          {tasks
            .filter((t) => t.display === 1)
            .map((task, i) => (
              <div className="flex flex-row items-center mb-2" key={i}>
                <input
                  type="checkbox"
                  id={task.id}
                  value={task.id}
                  onChange={(e) => handleCheck(e.target.value)}
                  checked={!tasksToHide.includes(task.id)}
                />
                <label className="ml-2 truncate" htmlFor={task.id}>
                  {task.name}
                </label>
              </div>
            ))}
        </div>
      )}
    </Popup>
  );
};

const Sort = ({ sortBy, setSortBy, sortTasksBy, setSortTasksBy }) => {
  return (
    <Popup
      trigger={
        <button className="flex flex-row items-center py-1 px-2 bg-gray-500 text-sm text-white rounded hover:bg-gray-700 focus:outline-none">
          <FunnelOutline color={"#ffffff"} height="17px" width="17px" />
          <p className="pl-2">Sort</p>
        </button>
      }
      position="bottom left"
      arrow={false}
      contentStyle={{ paddingTop: "0.5rem" }}
    >
      {(close) => (
        <div className="px-4 py-4 bg-white shadow-md rounded">
          <p className="text-xl font-bold my-1">Sort</p>
          <form className="w-56">
            <p className="text-base font-bold my-1">Students</p>
            <input
              type="radio"
              id="indexLowToHigh"
              name="sort"
              className="mr-2 mb-2"
              checked={sortBy === "indexLowToHigh"}
              onClick={() => setSortBy("indexLowToHigh")}
            />
            <label for="indexLowToHigh">Index: Low to High</label>
            <br />
            <input
              type="radio"
              id="indexHightoLow"
              name="sort"
              className="mr-2 mb-2"
              checked={sortBy === "indexHightoLow"}
              onClick={() => setSortBy("indexHightoLow")}
            />
            <label for="indexHightoLow">Index: High to Low</label>
            <br />
            <input
              type="radio"
              id="starsHighToLow"
              name="sort"
              className="mr-2 mb-2"
              checked={sortBy === "starsHighToLow"}
              onClick={() => setSortBy("starsHighToLow")}
            />
            <label for="starsHighToLow">Stars: High to Low</label>
            <br />
            <input
              type="radio"
              id="starsLowToHigh"
              name="sort"
              className="mr-2 mb-2"
              checked={sortBy === "starsLowToHigh"}
              onClick={() => setSortBy("starsLowToHigh")}
            />
            <label for="starsLowToHigh">Stars: Low to High</label>
            <br />
          </form>
          <hr class="my-2" />
          <form>
            <p className="text-base font-bold my-1">Tasks</p>
            <input
              type="radio"
              id="publishOldToNew"
              name="sort"
              className="mr-2 mb-2"
              checked={sortTasksBy === "publishOldToNew"}
              onClick={() => setSortTasksBy("publishOldToNew")}
            />
            <label for="publishOldToNew">Oldest to Newest</label>
            <br />
            <input
              type="radio"
              id="publishNewToOld"
              name="sort"
              className="mr-2 mb-2"
              checked={sortTasksBy === "publishNewToOld"}
              onClick={() => setSortTasksBy("publishNewToOld")}
            />
            <label for="publishNewToOld">Newest to Oldest</label>
          </form>
        </div>
      )}
    </Popup>
  );
};

const StudentName = ({ index, tableNames }) => {
  return tableNames.filter((obj) => obj.studentIndex == index)[0].name;
};

const SubmissionSummary = ({
  student_id,
  tasks,
  sortedTasks,
  shownTasks,
  submissions,
  submissionStatuses,
}) => {
  if (!submissions || !submissionStatuses) return <h1></h1>;
  return (
    <div className="flex flex-row flex-wrap mt-1">
      {shownTasks().map((task, i) => {
        const sub = submissions.filter(
          (submission) =>
            submission.student === student_id && submission.task === task.id
        )[0];
        const status = submissionStatuses.filter(
          (status) => status.student === student_id && status.task === task.id
        )[0];

        let statusIcon = <h1></h1>;

        if (!sub) {
          // no submission
          if (!status) {
            // no status indicated
            statusIcon = // has not started
              (
                <svg width="20" height="20" className="pr-0.5">
                  <rect
                    width="14"
                    height="14"
                    x="2"
                    y="2"
                    rx="2"
                    ry="2"
                    className="rounded"
                    style={{
                      fill: "#D1D5DB",
                      stroke: "#9CA3AF",
                      strokeWidth: "2",
                    }}
                  ></rect>
                </svg>
              );
          } else {
            // status indicated
            if (status.status === 0) {
              // has not started
              statusIcon = (
                <svg width="20" height="20" className="pr-0.5">
                  <rect
                    width="14"
                    height="14"
                    x="2"
                    y="2"
                    rx="2"
                    ry="2"
                    className="rounded"
                    style={{
                      fill: "#D1D5DB",
                      stroke: "#9CA3AF",
                      strokeWidth: "2",
                    }}
                  ></rect>
                </svg>
              );
            } else if (status.status === 1) {
              // working on it
              statusIcon = (
                <svg width="20" height="20" className="pr-0.5">
                  <rect
                    width="14"
                    height="14"
                    x="2"
                    y="2"
                    rx="2"
                    ry="2"
                    className="rounded"
                    style={{
                      fill: "#FCD34D",
                      stroke: "#FBBF24",
                      strokeWidth: "2",
                    }}
                  ></rect>
                </svg>
              );
            } else if (status.status === 2) {
              statusIcon = (
                <svg width="20" height="20" className="pr-0.5">
                  <rect
                    width="14"
                    height="14"
                    x="2"
                    y="2"
                    rx="2"
                    ry="2"
                    className="rounded"
                    style={{
                      fill: "#FCA5A5",
                      stroke: "#F87171",
                      strokeWidth: "2",
                    }}
                  ></rect>
                </svg>
              );
            }
          }
        } else if (![0, 1, 2, 3, 4, 5].includes(sub.stars)) {
          // submitted but not reviewed
          statusIcon = (
            <svg width="20" height="20" className="pr-0.5">
              <rect
                width="14"
                height="14"
                x="2"
                y="2"
                rx="2"
                ry="2"
                className="rounded"
                style={{
                  fill: "#6EE7B7",
                  stroke: "#34D399",
                  strokeWidth: "2",
                }}
              ></rect>
            </svg>
          );
        } else {
          statusIcon = (
            <svg width="20" height="20" className="pr-0.5">
              <rect
                width="14"
                height="14"
                x="2"
                y="2"
                rx="2"
                ry="2"
                className="rounded"
                style={{
                  fill: "#10B981",
                  stroke: "#059669",
                  strokeWidth: "2",
                }}
              ></rect>
            </svg>
          );
        }

        return (
          <Popup
            key={i}
            trigger={statusIcon}
            position="bottom center"
            on={["hover", "focus"]}
            arrow
            arrowStyle={arrowStyle}
          >
            <div className="py-1 px-2 bg-gray-700 rounded mb-2">
              <p className="text-white text-sm">{task.name}</p>
            </div>
          </Popup>
        );
      })}
    </div>
  );
};

const Submission = ({
  submissions,
  sub,
  tableNames,
  sp,
  task,
  addReview,
  sendJsonMessage,
  submissionStatuses,
}) => {
  submissions = submissions
    .filter((s) => s.task === task.id)
    .sort((a, b) => a.student - b.student);

  let submittedStudents = [];
  for (let i = 0; i < submissions.length; i++) {
    submittedStudents.push(submissions[i].student);
  }
  const students = tableNames.filter((s) =>
    submittedStudents.includes(s.studentUserID)
  );

  const [submission, setSubmission] = useState(sub);
  const [student, setStudent] = useState(sp);
  const [subStatus, setSubStatus] = useState(-1);

  useEffect(() => {
    if (!submissionStatuses) {
      return;
    }
    const filteredStatus = submissionStatuses.filter(
      (s) => s.student === student.studentUserID && s.task === task.id
    );
    if (filteredStatus.length > 0) {
      setSubStatus(filteredStatus[0].status);
    }
  }, [student.id, task.id, submissionStatuses]);

  const shortened = (text, maxLength) => {
    if (text.length > maxLength) return text.substring(0, maxLength) + "...";
    return text;
  };



  const toggleSubmissions = (direction) => {
    switch (direction) {
      case "forward":
        setSubmission(
          Object.values(submissions)[
            Object.values(submissions).indexOf(submission) + 1
          ]
        );
        setStudent(
          Object.values(students)[Object.values(students).indexOf(student) + 1]
        );
        break;
      case "backward":
        setSubmission(
          Object.values(submissions)[
            Object.values(submissions).indexOf(submission) - 1
          ]
        );
        setStudent(
          Object.values(students)[Object.values(students).indexOf(student) - 1]
        );
        break;
    }
  };


  return (
    <CustomPopup
      trigger={
        <td className="px-2 py-2 border-r-2 min-w-48 cursor-pointer hover:bg-gray-100">
          {[0, 1, 2, 3, 4, 5].includes(sub.stars) ? (
            <p className="text-lg">
              {"★".repeat(sub.stars) + "☆".repeat(task.max_stars - sub.stars)}
            </p>
          ) : (
            <p className="italic text-xs mb-2">Not reviewed yet.</p>
          )}
          <p>
            {subStatus === -1
              ? " "
              : subStatus === 1
              ? "Not Started❗️"
              : subStatus === 2
              ? "Working On It❗️"
              : subStatus === 3
              ? "Stuck❗️"
              : ""}
          </p>

          <p className="border-t border-gray-300"></p>
          {sub?.text && (
            <p className="flex-none text-xs text-gray-700 mt-2">
              {shortened(sub.text, sub.text && sub.image ? 40 : 100)}
            </p>
          )}

          <img
            className="mt-2"
            src={sub.image}
            style={{ maxHeight: "100px" }}
            onError={() => sendJsonMessage({ submission: sub.id })}
          />
        </td>
      }
      contentStyle={{
        maxHeight: "500px",
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
      onOpen={() => {
        setSubmission(sub);
        setStudent(sp);
      }}
      onClose={() => {
        setSubmission(sub);
        setStudent(sp);
      }}
    >
      <div className="flex flex-row items-center">
        {Object.values(students).indexOf(student) !== 0 && (
          <button
            className="fixed bg-gray-100 -left-16 rounded-md py-3 px-1 focus:outline-none hover:bg-gray-200"
            onClick={() => toggleSubmissions("backward")}
          >
            <ArrowBackOutline
              color={"#00000"}
              title={"Previous Submission"}
              height="40px"
              width="40px"
            />
          </button>
        )}

        <div className="flex flex-col px-4 py-4 bg-white rounded-lg popup overflow-y-auto max-h-500px">
          <div className="flex flex-row text-xl">
            <p>Index:</p>
            <p className="ml-2 font-bold">{student.studentIndex}</p>
            {student.name !== "" && (
              <>
                <p className="ml-4">Name:</p>
                <p className="ml-2 font-bold">{student.name}</p>
              </>
            )}
          </div>

          <div className="flex flex-row mt-6 items-center">
            <h1 className="text-lg font-bold">Submission</h1>
            {/* if it is an image */}
            {submission.image && (
              <a
                href={submission.image}
                className="text-sm text-white py-0.5 px-1 ml-4 bg-gray-500 hover:bg-gray-600 rounded"
                download="submission.png"
                target="_blank"
              >
                Full Image
              </a>
            )}
          </div>

          {/* if it is a text */}
          <div className="border-2 border-gray-300 rounded mt-4">
            <p className="ml-2 px-2 py-2 whitespace-pre-wrap">
              <CustomLinkify>{submission.text}</CustomLinkify>
            </p>

            {submission.image && (
              <img
                src={submission.image}
                className="px-2 py-2 mx-auto"
                style={{ maxHeight: 300 }}
                // onError={() => reloadSubmission(submission.id)}
              />
            )}
          </div>

          <p className="border-b-2 border-gray-200 mt-6"></p>

          {[0, 1, 2, 3, 4, 5].includes(submission.stars) ? (
            <Review sub={submission} task={task} />
          ) : (
            <ReviewForm
              sub={submission}
              task={task}
              addReview={addReview}
              setSubmission={setSubmission}
            />
          )}
        </div>
        {Object.values(students).indexOf(student) !== students.length - 1 && (
          <button
            className="fixed bg-gray-100 -right-16 rounded-md py-3 px-1 focus:outline-none hover:bg-gray-200"
            onClick={() => toggleSubmissions("forward")}
          >
            <ArrowForwardOutline
              color={"#00000"}
              title={"Next Submission"}
              height="40px"
              width="40px"
            />
          </button>
        )}
      </div>
    </CustomPopup>
  );
};

const Review = ({ sub, task }) => {
  return (
    <>
      <h1 className="text-lg font-bold mt-6">My Review</h1>
      <p className="text-2xl mt-2">
        {"★".repeat(sub.stars) + "☆".repeat(task.max_stars - sub.stars)}
      </p>
      <p className="italic whitespace-pre-wrap">
        {sub.comments !== "" ? sub.comments : "No additional comments."}
      </p>
    </>
  );
};

const ReviewForm = ({ sub, task, addReview, setSubmission }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [tempStars, setTempStars] = useState(0);
  const [savedStars, setSavedStars] = useState(false);
  const [comment, setComment] = useState("");

  const starIsDark = (i) => {
    if (isHover) {
      if (tempStars >= i) return true;
    } else {
      if (savedStars !== false) {
        if (savedStars >= i) return true;
      }
    }
    return false;
  };

  const formSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    addReview(
      sub.id,
      savedStars !== false ? savedStars + 1 : 0,
      comment,
      setSubmission
    );
  };

  return (
    <>
      <h1 className="text-lg font-bold mt-6">Leave a Review</h1>
      <form onSubmit={(e) => formSubmit(e)}>
        <div className="flex flex-row">
          {Array.from(Array(task.max_stars).keys()).map((a, i) => (
            <p
              className="text-2xl cursor-pointer"
              key={i}
              onMouseEnter={() => {
                setIsHover(true);
                setTempStars(i);
              }}
              onMouseLeave={() => setIsHover(false)}
              onClick={() => setSavedStars(i)}
            >
              {starIsDark(i) ? "★" : "☆"}
            </p>
          ))}
        </div>
        <textarea
          onChange={(e) => setComment(e.target.value)}
          className="w-full outline-none border-2 border-gray-100 focus:border-gray-300 py-2 px-2 my-2 rounded-lg"
          rows="4"
          value={comment}
          name="description"
          placeholder="Leave a comment..."
        />

        {isLoading ? (
          <button
            type="submit"
            className="px-2 py-1 rounded text-white bg-gray-600"
            disabled={true}
          >
            Submit
          </button>
        ) : (
          <button
            type="submit"
            className="px-2 py-1 rounded text-white bg-gray-500 hover:bg-gray-600"
            disabled={savedStars === false && task.max_stars > 0}
          >
            Submit
          </button>
        )}
      </form>
    </>
  );
};

const TaskMenu = ({
  task,
  setOneTask,
  deleteTask,
  submissions,
  tasksToHide,
  setTasksToHide,
  classroom,
}) => {
  const [isCloseOnDocClick, setIsCloseOnDocClick] = useState(true);

  if (!submissions) return <h1></h1>;

  return (
    <Popup
      trigger={
        <p className="ml-auto px-2 py-0.5 rounded hover:bg-gray-300 cursor-pointer">
          ⋮
        </p>
      }
      position="left top"
      arrow={false}
      closeOnDocumentClick={isCloseOnDocClick}
      {...{ contentStyle, arrowStyle }}
    >
      {(close) => (
        <div className="flex flex-col bg-gray-700 text-gray-300 py-1 px-3 rounded w-40">
          <TaskDetails
            task={task}
            setOneTask={setOneTask}
            setIsCloseOnDocClick={setIsCloseOnDocClick}
            subs={submissions.filter((s) => s.task === task.id)}
          />
          <HideTask
            task={task}
            tasksToHide={tasksToHide}
            setTasksToHide={setTasksToHide}
            classroom={classroom}
          />
          <DeleteTask
            id={task.id}
            setIsCloseOnDocClick={setIsCloseOnDocClick}
            deleteTask={deleteTask}
            popupClose={close}
          />
        </div>
      )}
    </Popup>
  );
};

const HideTask = ({ task, tasksToHide, setTasksToHide, classroom }) => {
  const trackSettings = (newSettings) => {
    localStorage.setItem(
      "tasksToHide" + classroom.code,
      JSON.stringify(newSettings)
    );
  };

  const handleChange = () => {
    setTasksToHide([...tasksToHide, task.id]);
    trackSettings([...tasksToHide, task.id]);
  };

  return (
    <p
      className="border-b-2 border-gray-500 py-1 hover:text-white cursor-pointer"
      onClick={() => handleChange()}
    >
      Hide
    </p>
  );
};

const TaskDetails = ({ task, setOneTask, setIsCloseOnDocClick, subs }) => {
  const [newTask, setNewTask] = useState();

  useEffect(() => {
    setNewTask(task);
  }, [task]);

  if (!newTask) return <h1></h1>;

  const minStars = () => {
    const stars = subs.map((s, i) => s.stars);
    return Math.max(...stars);
  };

  return (
    <CustomPopup
      trigger={
        <p className="border-b-2 border-gray-500 py-1 hover:text-white cursor-pointer">
          Details
        </p>
      }
      onOpen={() => setIsCloseOnDocClick(false)}
      onClose={() => {
        if (newTask.name.trim() === "") {
          alert("Task name should not be empty.");
          setIsCloseOnDocClick(false);
          return;
        }
        setIsCloseOnDocClick(true);
        setOneTask(newTask);
      }}
    >
      <div className="flex flex-col px-4 py-4 bg-white rounded-lg shadow-md popup">
        <input
          onChange={(e) =>
            setNewTask({
              ...newTask,
              [e.target.name]: e.target.value,
            })
          }
          onBlur={() => setOneTask(newTask)}
          className="outline-none text-2xl border-b-2 border-gray-100 hover:border-gray-300 focus:border-red-500 my-2 mx-2 w-min"
          value={newTask.name}
          name="name"
        />
        <textarea
          onChange={(e) =>
            setNewTask({
              ...newTask,
              [e.target.name]: e.target.value,
            })
          }
          onBlur={() => setOneTask(newTask)}
          className=" outline-none text-sm border-2 border-gray-100 hover:border-gray-300 focus:border-red-500 py-2 px-2 my-2 mx-2 rounded-lg"
          rows="4"
          value={newTask.description}
          name="description"
        />
        <div className="flex flex-row">
          <div>
            <label htmlFor="status" className="px-2 pt-2">
              Status
            </label>
            <select
              onChange={(e) => {
                setOneTask({
                  ...newTask,
                  [e.target.name]: e.target.value,
                });
              }}
              className="outline-none py-2 px-2 my-1 mx-2 rounded-lg bg-gray-100 w-min"
              id="status"
              name="status"
              value={newTask.status}
            >
              <option value={1}>In Progress</option>
              <option value={2}>Completed</option>
            </select>
          </div>
          <div></div>
        </div>
      </div>
    </CustomPopup>
  );
};

const NewTask = ({
  classroom,
  classrooms,
  addTask,
  deleteTask,
  updateDraftTask,
  tasks,
  changeNewTaskPage,
  showNewTask,
  setShowNewTask,
  showDraftsMenu,
  setShowDraftsMenu,
  showImportTask,
  setShowImportTask,
  newTaskModalOpen,
  setNewTaskModalOpen,
  fetchTasksFromClassroom,
  importMenuTaskList,
  setImportMenuTaskList,
  tasksIDToImport,
  setTasksIDToImport,
  addImportedTask,
}) => {
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [draftTaskID, setDraftTaskID] = useState(0);

  const [showRequiredSelection, setShowRequiredSelection] = useState(false); //if user did not select at least one task before importing, show error message

  const [task, setTask] = useState({
    name: "",
    description: "",
    max_stars: 5,
    display: 0,
  });

  const saveDraft = () => {
    setTask({
      ...task,
      display: 2,
    });
  };

  useEffect(() => {
    //add task if task.display changes to 1 or 2
    if (task.display != 0) {
      if (isEditingDraft) {
        updateDraftTask(task, draftTaskID);
        setIsEditingDraft(false);
        if (task.display === 2) {
          changeNewTaskPage("draftsMenu"); // go back to drafts menu if user clicks "Save to Drafts" when editing a draft
        } else if (task.display === 1) {
          setNewTaskModalOpen(false); //close modal when user publishes draft
        }
      } else {
        addTask(task);
        setNewTaskModalOpen(false);
      }
      setTask({ name: "", description: "", max_stars: 5, display: 0 }); // reset form fields
      setDraftTaskID(0);
    }
  }, [task.display]);

  const prefillDraftTask = (draftTask) => {
    setIsEditingDraft(true);
    setDraftTaskID(draftTask.id);
    setTask({
      name: draftTask.name,
      description: draftTask.description,
      max_stars: 5,
      display: 0,
    });
  };

  const handleImportCheck = (raw_id) => {
    const id = parseInt(raw_id);
    if (tasksIDToImport.includes(id)) {
      setTasksIDToImport(tasksIDToImport.filter((t) => t != id));
    } else {
      setTasksIDToImport([...tasksIDToImport, id]);
    }
  };

  const handlePostingImportedTask = (displayNum) => {
    if (tasksIDToImport.length > 0) {
      setShowRequiredSelection(false);
      let sortedTasksIDToImport = tasksIDToImport.sort((a, b) =>
        a > b ? 1 : -1
      ); // sort tasks in ascending id

      //create an array of imported tasks with their corresponding details from the array of imported tasks IDs
      const tasksToDuplicate = importMenuTaskList.filter((t) => {
        return sortedTasksIDToImport.some((id) => {
          return id === t.id;
        });
      });

      const importedTasks = tasksToDuplicate.map((t) => ({
        code: classroom.code,
        name: t.name,
        description: t.description,
        max_stars: 5,
        display: displayNum,
      }));

      addImportedTask(importedTasks);
      setNewTaskModalOpen(false);
      changeNewTaskPage("newTask");
    } else {
      setShowRequiredSelection(true);
    }
  };

  return (
    <Popup
      modal
      overlayStyle={{ background: "rgba(0,0,0,0.4)" }}
      closeOnDocumentClick
      open={newTaskModalOpen}
      onClose={() => setNewTaskModalOpen(false)}
      contentStyle={{
        overflowY: "auto",
        marginTop: "min(60px, 100%)",
        marginBottom: "min(60px, 100%)",
      }}
    >
      {showNewTask ? (
        <div>
          <div className="flex flex-row">
            <button
              onClick={() => changeNewTaskPage("newTask")}
              className="bg-white px-4 py-4 w-full rounded-tl-lg focus:outline-none cursor-pointer border-b-2 border-red-600"
            >
              <p className="text-red-600 font-medium">New Task</p>
            </button>
            <button
              onClick={() => {
                changeNewTaskPage("importTask");
              }}
              className="bg-white px-4 py-4 w-full rounded-tr-lg focus:outline-none cursor-pointer border-b border-gray-300"
            >
              <p className="text-gray-500 font-medium hover:text-red-600">
                Import Tasks
              </p>
            </button>
          </div>
          <form
            className="flex flex-col px-4 py-4 bg-white rounded-b-lg rounded-t-none shadow-md popup"
            onSubmit={(e) => {
              e.preventDefault();
              setTask((task) => ({
                ...task,
                display: 1,
              }));
            }}
          >
            <input
              onChange={(e) =>
                setTask({
                  ...task,
                  [e.target.name]: e.target.value,
                })
              }
              className="outline-none text-2xl border-b-2 border-gray-300 focus:border-gray-500 my-2 mx-2"
              value={task.name}
              name="name"
              placeholder="Enter task name here..."
              autoComplete="off"
              required
            />
            <textarea
              onChange={(e) =>
                setTask({
                  ...task,
                  [e.target.name]: e.target.value,
                })
              }
              className="outline-none resize-none text-sm border-2 border-gray-300 focus:border-gray-500 py-2 px-2 my-2 mx-2 rounded-lg"
              rows="4"
              value={task.description}
              name="description"
              placeholder="Enter task description here..."
            />
            <div className="flex flex-row items-center space-x-4 ml-4">
              <label>
                <input
                  type="radio"
                  name="isGroupSubmission"
                  value="true"
                  checked={task.isGroupSubmission === true}
                  onChange={(e) =>
                    setTask({ ...task, isGroupSubmission: true })
                  }
                  required
                />
                <span className="ml-1">Group Submission</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="isGroupSubmission"
                  value="false"
                  checked={task.isGroupSubmission === false}
                  onChange={(e) =>
                    setTask({ ...task, isGroupSubmission: false })
                  }
                />
                <span className="ml-1">Individual Submission</span>
              </label>
            </div>

            <label htmlFor="max_stars" className="px-2 pt-2">
              Max. Stars: 5
            </label>

            <div className="flex">
              <button
                type="submit"
                className="mt-4 ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer focus:outline-none"
              >
                Publish Task
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  saveDraft();
                }}
                className="mt-4 ml-4 px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer focus:outline-none"
              >
                {isEditingDraft ? "Save to Drafts" : "Add to Drafts"}
              </button>
              <button
                type="button"
                onClick={() => {
                  changeNewTaskPage("draftsMenu");
                }}
                className="mt-4 mr-2 px-2 py-1 text-gray-500 rounded text-sm ml-auto hover:text-gray-600 cursor-pointer hover:underline focus:outline-none"
              >
                {isEditingDraft ? "Back to Drafts" : "Go to Drafts"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <></>
      )}

      {showDraftsMenu ? (
        <div className="px-6 py-4 bg-white rounded-lg shadow-lg popup ">
          <div className="mx-2">
            <div className="flex justify-between items-center">
              <h1 className="my-2 text-2xl font-bold">Drafts</h1>
              <button
                onClick={() => changeNewTaskPage("newTask")}
                className="focus:outline-none cursor-pointer"
              >
                <p className="text-gray-500 hover:underline">Create New Task</p>
              </button>
            </div>
            <div className="w-full h-0.5 bg-gray-200"></div>
          </div>
          <div className="mt-2">
            {tasks.filter((t) => t.display === 2).length > 0 ? (
              tasks
                .filter((t) => t.display === 2)
                .map((draftTask, i) => {
                  return (
                    <div className="flex justify-between">
                      <div
                        onClick={() => {
                          prefillDraftTask(draftTask);
                          changeNewTaskPage("newTask");
                        }}
                        className="pt-3 pb-2 px-2 cursor-pointer hover:bg-gray-200 bg-white rounded-lg w-5/6 max-w-full"
                        key={i}
                      >
                        <div className="flex items-center w-full">
                          <div className="bg-gray-300 w-1.5 h-14 rounded-2xl flex-none"></div>
                          <div className="ml-4 flex flex-col justify-center w-5/6">
                            {draftTask.name ? (
                              <h2 className="text-lg font-semibold truncate">
                                {draftTask.name}
                              </h2>
                            ) : (
                              <h2 className="text-lg italic text-gray-500 font-medium">
                                Untitled
                              </h2>
                            )}
                            {draftTask.description ? (
                              <p className="font-medium text-gray-500 text-sm truncate">
                                {draftTask.description}
                              </p>
                            ) : (
                              <p className="my-1 font-regular italic text-gray-400 text-sm">
                                No Description
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(draftTask.id)}
                        className="mx-5 cursor-pointer focus:outline-none"
                      >
                        <img src="/delete_icon.svg" width="15px" />
                      </button>
                    </div>
                  );
                })
            ) : (
              <p className="mx-2 my-4">No Saved Drafts</p>
            )}
          </div>
        </div>
      ) : (
        <></>
      )}

      {showImportTask ? (
        <div>
          <div className="flex flex-row">
            <button
              onClick={() => {
                changeNewTaskPage("newTask");
                setShowRequiredSelection(false);
                setImportMenuTaskList([]);
                setTasksIDToImport([]);
              }}
              className="bg-white px-4 py-4 w-full rounded-tl-lg focus:outline-none cursor-pointer border-b border-gray-300"
            >
              <p className="text-gray-500 font-medium hover:text-red-600">
                New Task
              </p>
            </button>
            <button
              onClick={() => {
                changeNewTaskPage("importTask");
              }}
              className="bg-white px-4 py-4 w-full rounded-tr-lg focus:outline-none cursor-pointer border-b-2 border-red-600"
            >
              <p className="text-red-600 font-medium">Import Tasks</p>
            </button>
          </div>
          <div className="px-6 py-4 bg-white rounded-b-lg rounded-t-none shadow-md popup">
            <h3 className="font-semibold">Select Classroom</h3>
            <p className="italic text-sm text-gray-600">
              You can only import from one classroom at a time
            </p>
            <select
              className="outline-none py-1.5 px-2 bg-gray-200 rounded-md w-full mt-2 mb-4 cursor-pointer"
              onChange={(e) => {
                setTasksIDToImport([]);
                fetchTasksFromClassroom(e.target.value);
              }}
              onKeyDown={(e) => {
                e.preventDefault();
                return false;
              }}
            >
              <select defaultValue="" disabled>
                <option value="" disabled></option>
              </select>
              {classrooms
                .filter((c) => c.name != classroom.name)
                .map((c, i) => {
                  return (
                    <option value={c.code} key={i}>
                      {c.name}
                    </option>
                  );
                })}
            </select>
            <form>
              <div className="flex flex-row items-center justify-between mb-2">
                <h3 className="font-semibold">
                  Tasks ({importMenuTaskList.length})
                </h3>
                {importMenuTaskList.length > 0 ? (
                  <div className="flex flex-row items-center ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setTasksIDToImport(importMenuTaskList.map((t) => t.id));
                      }}
                      className="focus:outline-none cursor-pointer text-sm text-red-500 font-medium hover:underline"
                    >
                      Select All
                    </button>
                    <p className="mx-1 text-sm">|</p>
                    <button
                      type="button"
                      onClick={() => {
                        setTasksIDToImport([]);
                      }}
                      className="focus:outline-none cursor-pointer text-sm text-red-500 font-medium hover:underline"
                    >
                      Unselect All
                    </button>
                  </div>
                ) : (
                  <></>
                )}
              </div>
              <div className="max-h-50vh overflow-y-auto">
                {importMenuTaskList
                  .filter((t) => t.display === 1)
                  .map((task, i) => (
                    <div className="flex items-center justify-between" key={i}>
                      <label id={task.id} className="flex items-center w-4/5">
                        <div className="bg-gray-300 w-1.5 h-12 rounded-2xl flex-none my-2 mr-2"></div>
                        <div className="w-full">
                          <p className="font-semibold truncate">{task.name}</p>
                          {task.description ? (
                            <p className="font-medium text-gray-500 text-sm truncate">
                              {task.description}
                            </p>
                          ) : (
                            <p className="font-regular italic text-gray-400 text-sm">
                              No Description
                            </p>
                          )}
                        </div>
                      </label>
                      <input
                        type="checkbox"
                        id={task.id}
                        onChange={(e) => handleImportCheck(e.target.value)}
                        checked={tasksIDToImport.includes(task.id)}
                        value={task.id}
                        className="cursor-pointer w-4 h-4 mr-4"
                      ></input>
                    </div>
                  ))}
              </div>

              <div className="bg-gray-300 h-0.5 my-4 w-full"></div>
              <div className="flex font-medium items-center">
                <div>
                  <p>Tasks Selected: {tasksIDToImport.length}</p>
                  {showRequiredSelection ? (
                    <p className="text-sm italic font-normal text-red-500">
                      Please select at least one task.
                    </p>
                  ) : (
                    <></>
                  )}
                </div>
                <div className="flex ml-auto gap-4">
                  <button
                    onClick={() => handlePostingImportedTask(2)}
                    type="button"
                    className="bg-gray-500 rounded px-3 py-1 hover:bg-gray-600 focus:outline-none"
                  >
                    <p className="text-white text-sm">Save to Drafts</p>
                  </button>

                  <button
                    onClick={() => handlePostingImportedTask(1)}
                    type="button"
                    className="bg-red-500 rounded px-3 py-1 hover:bg-red-600 focus:outline-none"
                  >
                    <p className="text-white text-sm">Publish Tasks</p>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <></>
      )}
    </Popup>
  );
};

const DeleteTask = ({ id, deleteTask, setIsCloseOnDocClick, popupClose }) => {
  return (
    <CustomPopup
      trigger={<p className="py-1 hover:text-white cursor-pointer">Delete</p>}
      onOpen={() => setIsCloseOnDocClick(false)}
      onClose={() => setIsCloseOnDocClick(true)}
    >
      {(close) => (
        <div className="flex flex-col px-6 py-8 bg-white rounded-lg w-56 sm:w-80">
          <h1 className="text-xl font-semibold text-center">Are you sure?</h1>
          <p className="text-gray-500 mt-2">
            This task and its submissions cannot be recovered.
          </p>
          <div className="flex flex-col mt-4">
            <button
              className="focus:outline-none px-2 py-1 border border-red-300 text-red-500 hover:bg-red-100 hover:border-red-500 hover:text-red-700 rounded mb-2"
              onClick={() => {
                deleteTask(id);
                close();
                popupClose();
              }}
            >
              Delete
            </button>
            <button
              className="focus:outline-none px-2 py-1 border border-gray-300 hover:bg-gray-100 hover:border-gray-400 rounded"
              onClick={() => {
                close();
                popupClose();
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

const StudentMenu = ({ index, removeIndex }) => {
  const [isCloseOnDocClick, setIsCloseOnDocClick] = useState(true);

  return (
    <Popup
      trigger={
        <p className="ml-auto px-2 py-0.5 rounded hover:bg-gray-300 cursor-pointer font-bold">
          ⋮
        </p>
      }
      position="left top"
      arrow={false}
      closeOnDocumentClick={isCloseOnDocClick}
      {...{ contentStyle, arrowStyle }}
    >
      {(close) => (
        <div className="flex flex-col bg-gray-700 text-gray-300 py-1 px-3 rounded w-40">
          <DeleteStudent
            {...{
              removeIndex,
              index,
              menuClose: close,
              setIsCloseOnDocClick,
            }}
          />
        </div>
      )}
    </Popup>
  );
};

const DeleteStudent = ({
  index,
  removeIndex,
  menuClose,
  setIsCloseOnDocClick,
}) => {
  return (
    <CustomPopup
      trigger={<p className="py-1 hover:text-white cursor-pointer">Delete</p>}
      onOpen={() => setIsCloseOnDocClick(false)}
      onClose={() => setIsCloseOnDocClick(true)}
    >
      {(close) => (
        <div className="flex flex-col px-6 py-8 bg-white rounded-lg w-56 sm:w-80">
          <h1 className="text-xl font-semibold text-center">Are you sure?</h1>
          <p className="text-gray-500 mt-2">
            This student's submissions and grades cannot be recovered.
          </p>
          <div className="flex flex-col mt-4">
            <button
              className="focus:outline-none px-2 py-1 border border-red-300 text-red-500 hover:bg-red-100 hover:border-red-500 hover:text-red-700 rounded mb-2"
              onClick={() => {
                removeIndex(index);
                close();
                menuClose();
              }}
            >
              Delete
            </button>
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

const TaskSummary = ({
  submissions,
  submissionStatuses,
  task,
  sortedStudents,
  names,
}) => {
  if (!submissions || !submissionStatuses) return null;

  let completedSubmissions = 0;
  let incompleteSubmissions = 0;
  let ungradedSubmissions = 0;
  sortedStudents().map((student, i) => {
    const sub = submissions.filter(
      (submission) =>
        submission.student === student.studentUserID &&
        submission.task === task.id
    )[0];

    const status = submissionStatuses.filter(
      (status) => status.student === student.id && status.task === task.id
    )[0];

    if (!sub) {
      // no submission
      if (!status) {
        // no status indicated
        // has not started
        incompleteSubmissions += 1;
      } else {
        // status indicated
        if (status.status === 0) {
          // has not started
          incompleteSubmissions += 1;
        } else if (status.status === 1) {
          // working on it
          incompleteSubmissions += 1;
        } else if (status.status === 2) {
          //need help
          incompleteSubmissions += 1;
        }
      }
    } else if (![0, 1, 2, 3, 4, 5].includes(sub.stars)) {
      // submitted but not reviewed
      completedSubmissions += 1;
      ungradedSubmissions += 1;
    } else {
      //submitted and reviewed
      completedSubmissions += 1;
    }
  });
  return (
    <Popup
      trigger={
        <img
          src="/barchart.svg"
          className="w-7 px-1.5 py-1.5 rounded hover:bg-gray-300"
        />
      }
      position="bottom right"
      on={["hover", "focus"]}
    >
      <div className="py-3 px-6 bg-gray-100 rounded mb-2 shadow-lg flex flex-col gap-2">
        <div className="flex justify-between">
          <div className="flex items-center">
            <p className="text-black text-sm font-semibold">Completed:</p>
          </div>
          <p className="right-0 ml-8 text-sm text-green-500 font-medium">
            {completedSubmissions}
          </p>
        </div>
        <div className="flex justify-between">
          <div className="flex items-center">
            <p className="text-black text-sm font-semibold">Incomplete:</p>
          </div>
          <p className="right-0 ml-8 text-sm text-red-500 font-medium">
            {incompleteSubmissions}
          </p>
        </div>
        <div className="border-t border-gray-400"></div>
        <div className="flex justify-between">
          <div className="flex items-center">
            <p className="text-black text-sm font-semibold">Ungraded:</p>
          </div>
          <p className="ml-8 text-gray-700 text-sm font-medium right-0">
            {ungradedSubmissions}
          </p>
        </div>
      </div>
    </Popup>
  );
};

const TaskSubmissionsBar = ({
  submissions,
  submissionStatuses,
  task,
  sortedStudents,
  names,
}) => {
  if (!submissions || !submissionStatuses) return null;

  let completedSubmissions = 0;
  let incompleteSubmissions = 0;
  let ungradedSubmissions = 0;

  sortedStudents().map((student, i) => {
    const sub = submissions.filter(
      (submission) =>
        submission.student === student.studentUserID &&
        submission.task === task.id
    )[0];

    const status = submissionStatuses.filter(
      (status) =>
        status.student === student.studentUserID && status.task === task.id
    )[0];

    if (!sub) {
      // no submission
      if (!status) {
        // no status indicated
        // has not started
        incompleteSubmissions += 1;
      } else {
        // status indicated
        if (status.status === 0) {
          // has not started
          incompleteSubmissions += 1;
        } else if (status.status === 1) {
          // working on it
          incompleteSubmissions += 1;
        } else if (status.status === 2) {
          //need help
          incompleteSubmissions += 1;
        }
      }
    } else if (![0, 1, 2, 3, 4, 5].includes(sub.stars)) {
      // submitted but not reviewed
      completedSubmissions += 1;
      ungradedSubmissions += 1;
    } else {
      //submitted and reviewed
      completedSubmissions += 1;
    }
  });

  let percentCompleted = ((completedSubmissions / names.length) * 100).toFixed(
    1
  );
  return (
    <div className="w-full h-1 bg-red-500 my-2">
      <div
        className="bg-green-500 h-full"
        style={{ width: `${percentCompleted}%` }}
      ></div>
    </div>
  );
};
