import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useGetMeQuery } from '../../redux/api/userApi';
import { useLazyLogoutQuery } from '../../redux/api/authApi';
import Search from './Search';

export default function Header() {
  const { isLoading } = useGetMeQuery();
  const [logout] = useLazyLogoutQuery();

  const { user } = useSelector((state) => state.auth);

  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    navigate(0);
  });

  return (
    <nav className="navbar row">

      <div className="col-12 col-md-3 ps-5">

        <div className="navbar-brand">
          <a href="/">
            <img src="../images/shopit_logo.png" alt="ShopIT Logo" />
          </a>
        </div>

      </div>

      <div className="col-12 col-md-6 mt-2 mt-md-0">
        <Search />
      </div>

      <div className="col-12 col-md-3 mt-4 mt-md-0 text-center">

        <a href="/cart" style={{ textDecoration: 'none' }}>
          <span id="cart" className="ms-3"> Cart </span>
          <span className="ms-1" id="cart_count"> 0 </span>
        </a>

        {user ? (
          <div className="ms-4 dropdown">

            <button
              className="btn dropdown-toggle text-white"
              type="button"
              id="dropDownMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <figure className="avatar avatar-nav">
                <img
                  src={user.avatar ? user.avatar.url : '../images/default_avatar.jpg'}
                  alt="User Avatar"
                  className="rounded-circle"
                />
              </figure>
              <span>{user.name}</span>
            </button>

            <div className="dropdown-menu w-100" aria-labelledby="dropDownMenuButton">
              <Link className="dropdown-item" to="/admin/dashboard"> Dashboard </Link>
              <Link className="dropdown-item" to="/me/orders"> Orders </Link>
              <Link className="dropdown-item" to="/me/profile"> Profile </Link>
              <Link className="dropdown-item text-danger" to="/" onClick={handleLogout}> Logout </Link>
            </div>

          </div>
        ) : (!isLoading && <Link to="/login" className="btn ms-4" id="login_btn"> Login </Link>)}

      </div>

    </nav>
  );
}
