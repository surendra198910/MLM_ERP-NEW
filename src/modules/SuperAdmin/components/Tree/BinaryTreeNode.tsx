import React from "react";
// Define the structure of props the component accepts
interface UserDescription {
  Sponsor?: string;
  Reg_Date?: string;
  Bot_Status?: string;
  Bot_Activation_Date?: string;
  totalleftTeamCount?: number;
  totalRightTeamCount?: number;
  leftTeamCount?: number;
  rightTeamCount?: number;
  leftRemainingTeamCount?: number;
  rightRemaining?: number;
  totalInvestmentAmount?: number;
}

interface User {
  id: string | number;
  username: string;
  image: string;
  paidstatus: string;
  left_child_id?: string | number | null;
  right_child_id?: string | number | null;
  description?: UserDescription;
}

interface BinaryTreeNodeProps {
  user: User;
  allUsers: User[];
  deep: number;
  maxDeep?: number;
  renderDetail?: (user: User) => React.ReactNode;
  renderNode?: (user: User) => React.ReactNode;
  onClick?: (id: string | number) => void;
  colorText?: string;
  imageFake?: string;
  nameFake?: string;
}

export default class BinaryTreeNode extends React.Component<BinaryTreeNodeProps> {
  render() {
    const {
      user,
      allUsers,
      deep,
      maxDeep = 4,
      renderDetail,
      renderNode,
      onClick,
      colorText = "#333",
      imageFake = "/plus.png",
      nameFake = "Blank",
    } = this.props;

    const fakeUser: User = {
      id: null,
      username: nameFake,
      paidstatus: null,
      left_child_id: null,
      right_child_id: null,
      image: imageFake,
    };

    let leftChild =
      allUsers.find((item) => item.id === user.left_child_id) || fakeUser;
    let rightChild =
      allUsers.find((item) => item.id === user.right_child_id) || fakeUser;
    const imageBaseUrl = import.meta.env.VITE_IMAGE_PREVIEW_URL;
    return (
      <li>
        {colorText && (
          <a
            onClick={() => {
              //alert(user.id)
              onClick && onClick(user.id);
            }}
            href="javascript:void(0)"
          >
            {renderNode ? (
              renderNode(user)
            ) : (
              <div className="distributor-wrap">
                <div
                  className={`avatar ${user.id ? (user.paidstatus === "Paid" ? "paid" : "unpaid") : ""}`}
                >
                  <img
                    src={`${imageBaseUrl}${user.image}`}
                    alt="User"
                    onError={(e: any) => {
                      e.target.src = `${imageBaseUrl}plus.png`;
                    }}
                  />
                </div>
                <span className="name text_yellow" style={{ color: colorText }}>
                  {user.username}
                </span>
              </div>
            )}

            <div className="distributor-details">
              {renderDetail ? (
                renderDetail(user)
              ) : (
                <div className="details-wrap">
                  {/* Header */}
                  <div className="details-title header">
                    Member Details
                    <span className="close-btn">×</span>
                  </div>

                  {/* Basic Info */}
                  <div className="details-row">
                    <span className="label">Member Name</span>
                    <span className="value">{user.username}</span>
                  </div>

                  <div className="details-row">
                    <span className="label">Sponsor Name</span>
                    <span className="value">
                      {user.description?.Sponsor || "-"}
                    </span>
                  </div>

                  <div className="details-row">
                    <span className="label">Joining Date</span>
                    <span className="value">
                      {user.description?.Reg_Date || "-"}
                    </span>
                  </div>

                  <div className="details-row">
                    <span className="label">Status</span>
                    <span
                      className={`status-badge ${
                        user.description?.Bot_Status === "Active"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {user.description?.Bot_Status || "-"}
                    </span>
                  </div>

                  <div className="details-row">
                    <span className="label">Investment</span>
                    <span className="value highlight">
                      $
                      {user.description?.totalInvestmentAmount?.toFixed(2) ||
                        "0"}
                    </span>
                  </div>

                  <div className="details-row">
                    <span className="label">Activation Date</span>
                    <span className="value">
                      {user.description?.Bot_Activation_Date || "-"}
                    </span>
                  </div>

                  {/* Business Section */}
                  <div className="details-subtitle">Business Summary</div>

                  <div className="business-grid">
                    <div className="business-box">
                      <span>Total Left</span>
                      <b>{user.description?.totalleftTeamCount ?? 0}</b>
                    </div>

                    <div className="business-box">
                      <span>Total Right</span>
                      <b>{user.description?.totalRightTeamCount ?? 0}</b>
                    </div>

                    <div className="business-box">
                      <span>Current Left</span>
                      <b>{user.description?.leftTeamCount ?? 0}</b>
                    </div>

                    <div className="business-box">
                      <span>Current Right</span>
                      <b>{user.description?.rightTeamCount ?? 0}</b>
                    </div>

                    <div className="business-box">
                      <span>Remaining Left</span>
                      <b>{user.description?.leftRemainingTeamCount ?? 0}</b>
                    </div>

                    <div className="business-box">
                      <span>Remaining Right</span>
                      <b>{user.description?.rightRemaining ?? 0}</b>
                    </div>
                  </div>
                </div>
              )}

              <div className="horizontal-line" />
              <div className="sloping-line" />
            </div>
          </a>
        )}

        {deep < maxDeep && (
          <ul>
            <BinaryTreeNode
              deep={deep + 1}
              maxDeep={maxDeep}
              allUsers={allUsers}
              user={leftChild}
              renderDetail={renderDetail}
              renderNode={renderNode}
              onClick={onClick}
              colorText={colorText}
              imageFake={imageFake}
              nameFake={nameFake}
            />
            <BinaryTreeNode
              deep={deep + 1}
              maxDeep={maxDeep}
              allUsers={allUsers}
              renderDetail={renderDetail}
              renderNode={renderNode}
              user={rightChild}
              onClick={onClick}
              colorText={colorText}
              imageFake={imageFake}
              nameFake={nameFake}
            />
          </ul>
        )}
      </li>
    );
  }
}
