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
  paidstatus:string,
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
      paidstatus:null,
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
                <div className={`avatar ${user.id ? (user.paidstatus === 'Paid' ? 'paid' : 'unpaid') : ''}`}>
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
                  <div className="details-title">Member Details</div>

                  <div className="details-row">
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <div className="label">Member Name</div>
                      <div className="value">{user.username}</div>
                    </div>
                  </div>

                  <div className="details-row">
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <div className="label">Sponsor Name</div>
                      <div className="value">
                        {user.description?.Sponsor || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="details-row">
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <div className="label">Joining Date</div>
                      <div className="value">
                        {user.description?.Reg_Date || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="details-row">
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <div className="label">Status</div>
                      <div className="value">
                        {user.description?.Bot_Status || "-"}
                      </div>
                    </div>
                  </div>
                  <div className="details-row">
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <div className="label">Investment</div>
                      <div className="value">
                        $
                        {user.description?.totalInvestmentAmount?.toFixed(2) ||
                          "0"}
                      </div>
                    </div>
                  </div>
                  <div className="details-row">
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <div className="label">Activation Date</div>
                      <div className="value">
                        {user.description?.Bot_Activation_Date || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="details-title"></div>

                  <div
                    className="details-row border-top-2"
                    style={{
                      background: "none",
                      gap: "10",
                      justifyContent: "space-between",
                      padding: "0",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      className="d-flex align-items-center justify-content-between"
                      style={{
                        background: "rgba(59, 59, 59, 0.68)",
                        width: "49%",
                        padding: "1px 4px",
                        marginBottom: "3px",
                      }}
                    >
                      <div className="label">Total Left Business</div>
                      <div className="value">
                        {user.description?.totalleftTeamCount ?? 0}
                      </div>
                    </div>

                    <div
                      className="d-flex align-items-center justify-content-between"
                      style={{
                        background: "rgba(59, 59, 59, 0.68)",
                        width: "49%",
                        padding: "1px 4px",
                        marginBottom: "3px",
                      }}
                    >
                      <div className="label">Total Right Business</div>
                      <div className="value">
                        {user.description?.totalRightTeamCount ?? 0}
                      </div>
                    </div>

                    <div
                      className="d-flex align-items-center justify-content-between"
                      style={{
                        background: "rgba(59, 59, 59, 0.68)",
                        width: "49%",
                        padding: "1px 4px",
                        marginBottom: "3px",
                      }}
                    >
                      <div className="label">Current Left Business</div>
                      <div className="value">
                        {user.description?.leftTeamCount ?? 0}
                      </div>
                    </div>

                    <div
                      className="d-flex align-items-center justify-content-between"
                      style={{
                        background: "rgba(59, 59, 59, 0.68)",
                        width: "49%",
                        padding: "1px 4px",
                        marginBottom: "3px",
                      }}
                    >
                      <div className="label">Current Right Business</div>
                      <div className="value">
                        {user.description?.rightTeamCount ?? 0}
                      </div>
                    </div>

                    <div
                      className="d-flex align-items-center justify-content-between"
                      style={{
                        background: "rgba(59, 59, 59, 0.68)",
                        width: "49%",
                        padding: "1px 4px",
                        marginBottom: "3px",
                      }}
                    >
                      <div className="label">Remaining Left Business</div>
                      <div className="value">
                        {user.description?.leftRemainingTeamCount ?? 0}
                      </div>
                    </div>

                    <div
                      className="d-flex align-items-center justify-content-between"
                      style={{
                        background: "rgba(59, 59, 59, 0.68)",
                        width: "49%",
                        padding: "1px 4px",
                        marginBottom: "3px",
                      }}
                    >
                      <div className="label">Remaining Right Business</div>
                      <div className="value">
                        {user.description?.rightRemaining ?? 0}
                      </div>
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
