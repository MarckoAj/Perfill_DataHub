window.doLogout = function(){localStorage.removeItem('authToken');localStorage.removeItem('hubOperationSession');window.location.assign('/login.html');};
