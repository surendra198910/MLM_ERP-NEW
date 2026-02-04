import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

type Notification = {
  id: string;
  icon: string;
  color: string;
  message: string;
  time: string;
  link: string;
  isNew?: boolean;
};

const notifications: Notification[] = [
  {
    id: "1",
    icon: "sms",
    color: "text-primary-500",
    message:
      'You have requested to <strong className="font-semibold">withdrawal</strong>',
    time: "2 hrs ago",
    link: "/notifications",
  },
  {
    id: "2",
    icon: "person",
    color: "text-[#39b2de]",
    message:
      '<strong className="font-semibold">A new user</strong> added in Trezo',
    time: "3 hrs ago",
    link: "/notifications",
    isNew: true,
  },
  {
    id: "3",
    icon: "mark_email_unread",
    color: "text-[#00b69b]",
    message:
      'You have requested to <strong className="font-semibold">withdrawal</strong>',
    time: "1 day ago",
    link: "/notifications",
  },
];

const Notifications: React.FC = () => {
  const [active, setActive] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDropdownToggle = () => {
    setActive((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className="relative group mx-[8px] md:mx-[10px] lg:mx-[12px]"
    >
      {/* 🔔 NOTIFICATION ICON */}
      <button
        type="button"
        onClick={handleDropdownToggle}
        className="leading-none inline-block transition-all
                   relative top-[2px]
                   hover:text-primary-500"
      >
        <i className="material-symbols-outlined !text-[22px] md:!text-[24px]">
          notifications
        </i>

        {/* DOT */}
        <span className="top-[3px] ltr:right-[4px] rtl:left-[4px]
                         w-[6px] h-[6px]
                         rounded-full absolute bg-orange-500" />
      </button>

      {/* 🧾 TOOLTIP */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-[38px]
                   px-2 py-1 text-xs rounded
                   bg-gray-800 text-white
                   opacity-0 group-hover:opacity-100
                   transition-opacity
                   whitespace-nowrap
                   pointer-events-none"
      >
        Notifications

        {/* ARROW */}
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2
                     w-0 h-0
                     border-l-4 border-r-4 border-b-4
                     border-l-transparent
                     border-r-transparent
                     border-b-gray-800"
        />
      </div>

      {/* 🔽 DROPDOWN */}
      {active && (
        <div className="notifications-menu-dropdown
                        bg-white dark:bg-[#0c1427]
                        shadow-3xl
                        py-[17px]
                        absolute mt-[17px] md:mt-[20px]
                        w-[290px] md:w-[350px]
                        z-[1]
                        top-full ltr:-right-[120px] ltr:md:right-0
                        rtl:-left-[120px] rtl:md:left-0
                        rounded-md"
        >
          <div className="flex items-center justify-between px-[20px] pb-[17px]">
            <span className="font-semibold text-black dark:text-white text-[15px]">
              Notifications{" "}
              <span className="text-gray-500 font-normal">
                ({notifications.length})
              </span>
            </span>

            <button
              type="button"
              className="text-primary-500"
            >
              Clear All
            </button>
          </div>

          <ul className="mb-[18px]">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="relative border-b border-dashed
                           border-gray-100 dark:border-[#172036]
                           py-[17px]
                           ltr:pl-[75px] ltr:pr-[20px]"
              >
                <div
                  className={`absolute top-1/2 -translate-y-1/2
                              ltr:left-[20px]
                              w-[44px] h-[44px]
                              rounded-full flex items-center justify-center
                              ${n.color} bg-[#4936f50d]`}
                >
                  <i className="material-symbols-outlined !text-[22px]">
                    {n.icon}
                  </i>
                </div>

                <span
                  className="block mb-[3px] text-black dark:text-white"
                  dangerouslySetInnerHTML={{ __html: n.message }}
                />

                <span className="text-gray-500 text-sm">
                  {n.time}
                </span>

                <Link
                  to={n.link}
                  className="absolute inset-0"
                />

                {n.isNew && (
                  <span className="absolute right-[20px]
                                   top-1/2 -translate-y-1/2
                                   w-[6px] h-[6px]
                                   bg-primary-500 rounded-full" />
                )}
              </li>
            ))}
          </ul>

          <div className="text-center">
            <Link
              to="/notifications"
              className="text-primary-500 font-medium hover:underline"
            >
              See All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
