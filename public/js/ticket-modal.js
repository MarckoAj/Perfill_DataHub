// =========================================================
// MODAL CHAMADO FUNCTIONS
// =========================================================

function openTicketModal() {
  document
    .getElementById('ticketDetailsModal')
    .classList.add('active');

  document.body.style.overflow = 'hidden';
}

function closeTicketModal() {
  document
    .getElementById('ticketDetailsModal')
    .classList.remove('active');

  document.body.style.overflow = 'auto';
}

// FECHAR AO CLICAR FORA
document
  .getElementById('ticketDetailsModal')
  .addEventListener('click', function (event) {

    if (event.target === this) {
      closeTicketModal();
    }
  });

// Adicionar evento de clique nas linhas da tabela
function addTableRowClickEvents() {
  document.querySelectorAll('#alertsTable tbody tr')
    .forEach((row) => {

      row.style.cursor = 'pointer';

      row.addEventListener('click', function () {
        openTicketModal();
      });
    });
}

// Chamar após renderizar a tabela
const originalRenderAlerts = renderAlerts;
renderAlerts = function() {
  originalRenderAlerts();
  setTimeout(addTableRowClickEvents, 100);
};
