import BinaryTree from '../../Tree/BinaryTree';
import React, { useState, useEffect } from "react";
import { ApiService } from "../../../../../services/ApiService";

const BinaryTreeComponent = () => {
  const { universalService, loading } = ApiService();
  const [firstNode, setfirstNode] = useState<any>(null);
  const [treeData, settreeData] = useState<any>([]);
  const [ClientID, setClientID] = useState(1);

  const generateTreeNodes = (Data: any) => {
    return Data.map((itm: any) => ({
      id: itm?.id,
      left_child_id: itm?.left_child_id,
      right_child_id: itm?.right_child_id,
      username: itm?.username,
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
        rightRemaining: itm?.RightRemainingTeamBotCount
      },
      image: (itm?.NodeImg)
    }));
  };

  const FetchNodeData = async (clientId: any) => {
    const param = { ClientId: clientId };
    const obj = {
      procName: 'GetBinaryTree',
      Para: JSON.stringify(param),
    };
    try {
      const res = await doAajxCall(obj);
      const treeNodes = generateTreeNodes(res);
      setfirstNode(treeNodes[0]);
      settreeData(treeNodes);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const doAajxCall = async (payload: any) => {
    try {
      return await universalService(payload);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  };

  useEffect(() => {
    FetchNodeData(ClientID);
  }, []);

  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      
      {/* --- HEADER ONLY --- */}
      <div className="trezo-card-header mb-[20px] pb-5 border-b border-gray-200 dark:border-[#172036] -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px] flex items-center justify-between">
        <div className="trezo-card-title">
          <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
            Binary Tree
          </h5>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="mt-5 min-h-[450px]">
        {firstNode ? (
          <div className="animate-in fade-in duration-500">
            <BinaryTree
              allUsers={treeData}
              rootUser={treeData[0]}
              bgSideBar={'#00b6eb'}
              colorText={'#333'}
              colorSideBar={'#fff'}
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