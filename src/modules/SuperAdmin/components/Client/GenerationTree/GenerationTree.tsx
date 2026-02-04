import { Formik, Field, Form } from "formik";
import * as Yup from "yup";
import React, { useState, useEffect } from "react";
import OrgChartComponent from "../GenerationTree/D3Chart";
import { ApiService } from "../../../../../services/ApiService";
import TreeSkeleton from "./TreeSkeleton";
import SelectUserModal from "../../../../../components/CommonFormElements/PopUp/SelectUserModal";

export interface OrgNode {
  id: string;
  parentId?: string | null;
  template: string;
}

interface TreeFormPropsType {
  Username: string;
}

const TreeForminitialValues: TreeFormPropsType = {
  Username: "",
};

const GenerationTreeContainer = () => {
  const { universalService } = ApiService();

  const [ClientID] = useState(1);
  const [data, setData] = useState<OrgNode[] | null>(null);
  const [filterColumn, setFilterColumn] = useState("__NONE__");
  const [hasVisited, setHasVisited] = useState(false);
  const [loading, setLoading] = useState(false);

  //for User Modal:
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);

  const TreeSchema = Yup.object().shape({
    Username: Yup.string().required("Enter Username"),
  });

  const doAajxCall = async (payload: any) => {
    try {
      return await universalService(payload);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }
  };
  const fetchManagers = async () => {
    try {
      const payload = {
        procName: "Client",
        Para: JSON.stringify({
          searchData: userSearch,
          ActionMode: "getUsersListByCompany",
        }),
      };

      const res = await universalService(payload);
      const data = res?.data || res;

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to load managers", err);
      setUsers([]);
    }
  };
  const parseNestedJsonStrings = (data: any) => {
    for (const key in data) {
      if (typeof data[key] === "string") {
        try {
          data[key] = JSON.parse(data[key]);
        } catch {
          continue;
        }
      } else if (typeof data[key] === "object" && data[key] !== null) {
        parseNestedJsonStrings(data[key]);
      }
    }
  };

  const FetchData = async (username: string) => {
    if (!username) return;

    setLoading(true); // ✅ Show skeleton immediately
    setHasVisited(true);
    setData(null); // ✅ Clear old data so old tree doesn't stay visible

    const param = {
      LoggedClientId: ClientID,
      SearchUsername: username,
    };

    const obj = {
      procName: "OrgTree",
      Para: JSON.stringify(param),
    };

    try {
      const res = await doAajxCall(obj);

      if (res[0]?.StatusCode === "0") {
        setData(null);
        return;
      }

      let parsedData = JSON.parse(res[0].OrganizationTree);

      if (parsedData && parsedData.length > 0) {
        parseNestedJsonStrings(parsedData);
        setData(parsedData as OrgNode[]);
      } else {
        setData(null);
      }
    } catch (error) {
      setData(null);
    } finally {
      setLoading(false); // ✅ Hide skeleton only when request is finished
    }
  };

  const handleSearch = (values: TreeFormPropsType) => {
    FetchData(values.Username);
  };

  useEffect(() => {
    const savedUser = "MLMERP";
    if (savedUser) {
      FetchData(savedUser);
    }
  }, []);

  //for User Modal
  useEffect(() => {
    fetchManagers();
  }, []);

  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      {/* --- HEADER & SEARCH SECTION --- */}
      <Formik
        initialValues={TreeForminitialValues}
        validationSchema={TreeSchema}
        onSubmit={(values, { setSubmitting }) => {
          handleSearch(values);
          setSubmitting(false);
        }}
      >
        {({ setFieldValue, values, resetForm }) => (
          <Form>
            <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
              <div className="trezo-card-title">
                <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
                  Generation Tree
                </h5>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
                <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
                  <div className="relative w-full sm:w-[180px]">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                      <i className="material-symbols-outlined !text-[18px]">
                        filter_list
                      </i>
                    </span>
                    <select
                      value={filterColumn}
                      onChange={(e) => setFilterColumn(e.target.value)}
                      className="w-full h-[34px] pl-8 pr-8 text-xs rounded-md appearance-none outline-none border border-gray-300 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-black dark:text-white transition-all focus:border-primary-button-bg"
                    >
                      <option value="__NONE__">Select Filter Option</option>
                      <option value="Username">Username</option>
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                      <i className="material-symbols-outlined !text-[18px]">
                        expand_more
                      </i>
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                      <i className="material-symbols-outlined !text-[18px]">
                        search
                      </i>
                    </span>
                    <Field
                      type="text"
                      name="Username"
                      placeholder="Enter Username..."
                      className="h-[34px] w-full pl-8 pr-3 text-xs rounded-md outline-none border border-gray-300 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-black dark:text-white focus:border-primary-button-bg transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-primary-button-bg hover:bg-primary-button-bg hover:text-white transition-all shadow-sm disabled:opacity-50"
                    >
                      <i className="material-symbols-outlined text-[20px]">
                        search
                      </i>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setIsUserModalOpen(true)}
                      className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-white text-white bg-primary-button-bg hover:bg-white hover:border-primary-button-bg hover:text-primary-button-bg transition-all disabled:opacity-50"
                    >
                      <i className="material-symbols-outlined text-[20px]">
                        add
                      </i>
                    </button>

                    {(filterColumn !== "__NONE__" ||
                      values.Username !== "") && (
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setFilterColumn("__NONE__");
                          setData(null);
                          setHasVisited(false);
                        }}
                        className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-gray-400 text-gray-500 hover:bg-gray-100 transition-all"
                      >
                        <i className="material-symbols-outlined text-[20px]">
                          refresh
                        </i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>

      {/* --- CONTENT AREA --- */}
      <div className="min-h-[450px] flex items-center justify-center">
        {/* 1. SKELETON LOADER (Highest Priority) */}
        {loading && <TreeSkeleton />}

        {/* 2. WELCOME VIEW (Only if never searched and not loading) */}
        {!loading && !hasVisited && (
          <div className="w-full bg-white dark:bg-[#0c1427] rounded-md border border-gray-200 dark:border-[#172036] p-10 flex flex-col md:flex-row items-center md:items-start justify-center md:gap-x-40 min-h-[450px] animate-in fade-in duration-500">
            <div className="md:max-w-md md:px-3 px-0 py-14">
              <h1 className="text-3xl font-semibold text-black dark:text-white mb-4">
                Generation Tree
              </h1>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-[15px]">
                Visualize your network hierarchy. <br />
                Search by <strong>Username</strong> using the filters above to
                generate the interactive tree.
              </p>
              <div className="flex items-center gap-2 text-primary-button-bg font-medium">
                <i className="material-symbols-outlined">info</i>
                <span>Use the search bar to get started</span>
              </div>
            </div>

            <div className="hidden md:flex">
              <svg
                viewBox="0 0 512 512"
                className="w-[320px] h-auto opacity-100 select-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="40"
                  y="80"
                  width="432"
                  height="340"
                  rx="30"
                  className="fill-primary-button-bg"
                />
                <path
                  d="M70 80H442C458.569 80 472 93.4315 472 110V130H40V110C40 93.4315 53.4315 80 70 80Z"
                  className="fill-primary-200"
                />
                <g className="fill-primary-200">
                  <rect x="90" y="210" width="25" height="25" rx="6" />
                  <rect x="140" y="210" width="240" height="15" rx="7.5" />
                  <rect x="90" y="265" width="25" height="25" rx="6" />
                  <rect x="140" y="265" width="240" height="15" rx="7.5" />
                  <rect x="90" y="320" width="25" height="25" rx="6" />
                  <rect x="140" y="320" width="240" height="15" rx="7.5" />
                </g>
                <rect
                  x="430"
                  y="420"
                  width="20"
                  height="80"
                  rx="5"
                  transform="rotate(-45 430 420)"
                  className="fill-primary-button-bg-hover"
                />
                <circle
                  cx="380"
                  cy="380"
                  r="90"
                  className="fill-primary-50 stroke-primary-200"
                  strokeWidth="8"
                />
              </svg>
            </div>
          </div>
        )}

        {/* 3. OOPS / NO RECORDS FOUND (Only if not loading, has searched, and no data) */}
        {!loading && hasVisited && data === null && (
          <div className="flex flex-col md:flex-row items-center justify-center p-10 gap-10 min-h-[450px] animate-in fade-in zoom-in duration-300">
            <div className="text-center md:text-left max-w-md">
              <h3 className="text-xl font-bold text-purple-600 mb-1">Oops!</h3>
              <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4">
                No Records Found!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                We couldn't find a generation tree for the username provided.
                Please check the spelling or try another user.
              </p>
            </div>

            <div className="flex-shrink-0">
              <svg
                viewBox="0 0 512 512"
                className="w-[320px] h-auto select-none"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
              >
                <path
                  d="M96 220L256 300L416 220"
                  className="stroke-primary-button-bg"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M96 220L150 160L256 200"
                  className="stroke-primary-button-bg"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M416 220L362 160L256 200"
                  className="stroke-primary-button-bg"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M96 220V340C96 360 112 376 132 376H380C400 376 416 360 416 340V220"
                  className="stroke-primary-button-bg"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M150 220L256 260L362 220L256 190L150 220Z"
                  className="fill-primary-button-bg"
                />
                <path
                  d="M256 110C300 90 340 110 340 140C340 165 300 175 256 200"
                  className="stroke-primary-button-bg"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="12 14"
                />
                <circle
                  cx="256"
                  cy="90"
                  r="26"
                  className="stroke-primary-button-bg fill-primary-50"
                  strokeWidth="6"
                />
                <path
                  d="M245 92H268C268 78 245 78 245 92C245 106 268 106 268 92"
                  className="stroke-primary-button-bg-hover"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        )}

        {/* 4. DATA FOUND - RENDER TREE (Only if not loading) */}
        {!loading && hasVisited && data !== null && (
          <div className="w-full h-full overflow-auto min-h-[500px] animate-in fade-in duration-500">
            <OrgChartComponent data={data} />
          </div>
        )}
      </div>

      <SelectUserModal
        open={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={users}
        search={userSearch}
        setSearch={setUserSearch}
        onSelect={(user) => {
          setSelectedUser(user);
          setIsUserModalOpen(false);
            console.log(user);
          // 🔥 auto-fill & search tree
          FetchData(user.Username);
        }}
      />
    </div>
  );
};

export default GenerationTreeContainer;
