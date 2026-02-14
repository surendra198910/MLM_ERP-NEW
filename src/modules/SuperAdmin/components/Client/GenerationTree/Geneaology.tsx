import BinaryTree from "../../Tree/BinaryTree";
import React, { useState, useEffect } from "react";
import { ApiService } from "../../../../../services/ApiService";
import AutoCompleter from "../../../../../components/CommonFormElements/InputTypes/AutoCompleter";

const BinaryTreeComponent = () => {
  const { universalService } = ApiService();
  const [firstNode, setfirstNode] = useState<any>(null);
  const [treeData, settreeData] = useState<any>([]);
  const [ClientID, setClientID] = useState(1);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const generateTreeNodes = (Data: any) => {
    return Data.map((itm: any) => ({
      id: itm?.id,
      left_child_id: itm?.left_child_id,
      right_child_id: itm?.right_child_id,
      username: itm?.username,
      paidstatus: itm.paidstatus,
      description: {
        userName: itm?.userName,
        Reg_Date: itm?.Reg_Date,
        Bot_Status: itm?.BotActivationStatus,
        Bot_Activation_Date: itm?.Bot_Activation_Date,
        totalInvestmentAmount: itm?.invested,
        Sponsor: itm?.Sponsor,
        totalleftTeamCount: itm?.TotalLeftTeamBotCount,
        totalRightTeamCount: itm?.TotalRightTeamBotCount,
        leftTeamCount: itm?.LeftTeamBotCount,
        rightTeamCount: itm?.RightTeamBotCount,
        leftRemainingTeamCount: itm?.LeftRemainingTeamBotCount,
        rightRemaining: itm?.RightRemainingTeamBotCount,
      },
      image: itm?.NodeImg,
    }));
  };

  const FetchNodeData = async (clientId: any) => {
    // ✅ Clear Old Tree Before Loading New
    setfirstNode(null);
    settreeData([]);
    const param = { ClientId: clientId };
    const obj = {
      procName: "GetBinaryTree",
      Para: JSON.stringify(param),
    };
    try {
      const res = await doAajxCall(obj);
      const treeNodes = generateTreeNodes(res);
      setfirstNode(treeNodes[0]);
      settreeData(treeNodes);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const doAajxCall = async (payload: any) => {
    try {
      return await universalService(payload);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }
  };
  const fetchManagers = async (searchText: string) => {
    try {
      setLoading(true);

      const payload = {
        procName: "Client",
        Para: JSON.stringify({
          searchData: searchText,
          ActionMode: "getUsersList",
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
    } finally {
      setLoading(false);
    }
  };
  const onClickUser = (userId: any) => {
    // Load more data dynamically based on clicked user
    FetchNodeData(userId);
  };
  useEffect(() => {
    FetchNodeData(ClientID);
  }, [ClientID]);

  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      {/* --- HEADER ONLY --- */}
      <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
        <div className="trezo-card-title">
          <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
            Binary Tree
          </h5>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
            <div>
              <div className="flex shadow-sm rounded-lg overflow-visible">
                <AutoCompleter
                  memberList={users}
                  loading={loading}
                  onSearch={fetchManagers} // Parent API Passed Here
                  onSelect={(member) => {
                    FetchNodeData(member.id);
                    console.log("Selected Member:", member);
                  }}
                />
                <button className="w-[55px] ml-2 rounded-md border flex items-center justify-center bg-primary-button-bg text-white hover:bg-primary-button-bg-hover transition">
                  <i className="material-symbols-outlined">search</i>
                </button>

                {/* Reload Button */}
                <button
                  onClick={() => {
                    // Reset to the main (root) node
                    setClientID(1); // Assuming 1 is the root ID
                    FetchNodeData(1); // Fetch the data for the root node
                    console.log("Reloaded to Main ID");
                  }}
                  className="w-[55px] ml-2 rounded-md border flex items-center justify-center bg-primary-button-bg text-white hover:bg-primary-button-bg-hover transition"
                >
                  <i className="material-symbols-outlined">refresh</i>{" "}
                  {/* Refresh Icon */}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="mt-5 min-h-[450px]">
        {firstNode ? (
          <div className="animate-in fade-in duration-500">
            <BinaryTree
              allUsers={treeData}
              rootUser={treeData[0]}
              bgSideBar={"#00b6eb"}
              colorText={"#333"}
              colorSideBar={"#fff"}
              // Pass onClick handler to BinaryTree
              onClickUser={onClickUser} // Pass onClick handler here
            />
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[450px]">
            <div className="spinner-border text-success" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BinaryTreeComponent;
