// src/InfoPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const InfoPage = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/"); // Điều hướng nếu không có token
        return;
      }

      try {
        const response = await axios.get("http://localhost:3000/info", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(response.data.userData);
      } catch (error) {
        console.error(error);
        navigate("/"); // Điều hướng nếu có lỗi
      }
    };

    fetchUserData();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Thông Tin Người Dùng
        </h2>
        {userData ? (
          <div>
            <p>
              <strong>Tên người dùng:</strong> {userData.username}
            </p>
            <p>
              <strong>Số điện thoại:</strong> {userData.phone_number}
            </p>
            <p>
              <strong>Địa chỉ:</strong> {userData.address}
            </p>
            <a href="/change-password" className="text-blue-600">
              Đổi mật khẩu
            </a>
          </div>
        ) : (
          <p>Đang tải thông tin...</p>
        )}
      </div>
    </div>
  );
};

export default InfoPage;
