import pool from "./conexao.js";

const executeQuery = (query, parametros = []) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((error, connection) => {
      if (error) {
        reject(error);
        return;
      }

      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          reject(err);
          return;
        }

        connection.query(query, parametros, (erros, resultados) => {
          if (erros) {
            connection.rollback(() => {
              connection.release();
              reject(erros);
            });
            return;
          }

          connection.commit((err) => {
            if (err) {
              connection.rollback(() => {
                connection.release();
                reject(err);
              });
              return;
            }

            connection.release();
            resolve(resultados);
          });
        });
      });
    });
  });
};

export default executeQuery;
