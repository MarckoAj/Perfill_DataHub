window.doLogout = function(){localStorage.removeItem('authToken');window.location.assign('/login.html');};
