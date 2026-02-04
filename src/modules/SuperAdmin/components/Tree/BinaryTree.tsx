import React, { useState } from "react";
import BinaryTreeNode from "./BinaryTreeNode";
import { FaChevronUp, FaAngleDoubleUp, FaArrowDown } from "react-icons/fa";
import "./BinaryTree.scss";
const BinaryTree = ({
  allUsers = [],
  imageFake,
  nameFake,
  maxDeep,
  renderDetail,
  renderNode,
  disableNavigation = false,
  disableSideBar = false,
  bgSideBar = '#00b6eb',
  colorSideBar = '#ffffff',
  colorText,
  bgButton = '#808285',
  colorButton = '#ffffff',
  rootUser,
}) => {
  const [selectedUser, setSelectedUser] = useState(rootUser);
  const [selectedUserLevel, setSelectedUserLevel] = useState(0);

  const goToTop = () => {
    setSelectedUser(rootUser);
    setSelectedUserLevel(0);
  };

  const goToBottomLeft = () => {
    let user = selectedUser;
    let level = selectedUserLevel;
    while (user && user.left_child_id) {
      user = allUsers.find(item => item.id === user.left_child_id);
      level++;
    }
    if (user) {
      setSelectedUser(user);
      setSelectedUserLevel(level);
    }
  };

  const goToBottomRight = () => {
    let user = selectedUser;
    let level = selectedUserLevel;
    while (user && user.right_child_id) {
      user = allUsers.find(item => item.id === user.right_child_id);
      level++;
    }
    if (user) {
      setSelectedUser(user);
      setSelectedUserLevel(level);
    }
  };

  const upOneLevel = () => {
    const user = [...allUsers, rootUser].find(
      item =>
        item.left_child_id === selectedUser.id ||
        item.right_child_id === selectedUser.id
    );
    if (user) {
      setSelectedUser(user);
      setSelectedUserLevel(selectedUserLevel - 1);
    }
  };

  const onClickUser = (userId) => {
    const user = allUsers.find(item => item.id === userId);
    if (user) {
      let level = 0;
      let currentUser = user;
      while (currentUser) {
        currentUser = allUsers.find(
          (user) =>
            user.left_child_id === currentUser.id ||
            user.right_child_id === currentUser.id
        );
        level++;
      }
      setSelectedUser(user);
      setSelectedUserLevel(level);
    }
  };

  return (
    <div className="flex justify-center p-4">
      <div id="binary-tree" className="flex flex-col w-full">
        {/* Sidebar */}
        {disableSideBar && (
          <div
            className="leftSidebar flex flex-col p-4"
            style={{ backgroundColor: bgSideBar }}
          >
            {[0, 1, 2, 3].map(level => (
              <div
                key={level}
                className={`level level-${level} p-2 mb-2`}
                style={{ backgroundColor: bgSideBar }}
              >
                <span
                  className="level-label"
                  style={{ color: colorSideBar }}
                >
                  Level {selectedUserLevel + level}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Binary Tree View */}
        <div className="tree">
          <ul>
            <BinaryTreeNode
              allUsers={allUsers}
              user={selectedUser}
              deep={1}
              maxDeep={maxDeep}
              renderDetail={renderDetail}
              renderNode={renderNode}
              onClick={onClickUser}
              colorText={colorText}
              imageFake={imageFake}
              nameFake={nameFake}
            />
          </ul>

          {/* Navigation Buttons */}
          {!disableNavigation && (
            <div className="navigation-buttons flex justify-between mt-4">
              <button
                className="button-tree bg-blue-500 text-white p-2 rounded"
                onClick={goToTop}
                disabled={selectedUser === rootUser}
                style={{ backgroundColor: bgButton, color: colorButton }}
              >
                <FaChevronUp />
                Back to Top
              </button>

              <button
                className="button-tree bg-blue-500 text-white p-2 rounded"
                onClick={upOneLevel}
                disabled={selectedUser === rootUser}
                style={{ backgroundColor: bgButton, color: colorButton }}
              >
                <FaAngleDoubleUp />
                Go Up
              </button>

              {/* Bottom Navigation */}
              <div className="flex space-x-2">
                <button
                  className="button-tree button-left bg-blue-500 text-white p-2 rounded"
                  onClick={goToBottomLeft}
                  disabled={!selectedUser.left_child_id}
                  style={{ backgroundColor: bgButton, color: colorButton }}
                >
                  <FaArrowDown />
                  Left Corner
                </button>
                <button
                  className="button-tree button-right bg-blue-500 text-white p-2 rounded"
                  onClick={goToBottomRight}
                  disabled={!selectedUser.right_child_id}
                  style={{ backgroundColor: bgButton, color: colorButton }}
                >
                  <FaArrowDown />
                  Right Corner
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BinaryTree;
