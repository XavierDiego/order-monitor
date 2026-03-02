const pt = {
  // OrdersScreen
  screen: {
    title: 'Pedidos',
    orderCount_one: '{{count}} pedido',
    orderCount_other: '{{count}} pedidos',
  },

  // ConnectionBadge
  connection: {
    connected: 'Conectado',
    reconnecting: 'Reconectando…',
    disconnected: 'Desconectado',
  },

  // StatusBadge
  status: {
    pending: 'Pendente',
    processing: 'Processando',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  },

  // EmptyState
  empty: {
    title: 'Nenhum pedido ainda',
    subtitle: 'Novos pedidos aparecerão aqui automaticamente.',
  },

  // ErrorState / ErrorBoundary
  error: {
    title: 'Algo deu errado',
    retry: 'Tentar novamente',
    unknown: 'Erro desconhecido',
  },

  // HomeScreen
  home: {
    title: 'Monitor de Pedidos',
    viewOrders: 'Ver Pedidos',
    viewOrdersDesc: 'Visualize em tempo real',
    addOrder: 'Novo Pedido',
    addOrderDesc: 'Adicione um pedido',
  },

  // Navigation headers
  nav: {
    orders: 'Pedidos',
    addOrder: 'Novo Pedido',
    editOrder: 'Editar Pedido',
  },

  // EditOrderScreen
  editOrder: {
    status: 'Novo status',
    save: 'Salvar alteração',
    success: 'Status atualizado!',
    errorNotFound: 'Pedido não encontrado.',
  },

  // AddOrderScreen
  addOrder: {
    customer: 'Cliente',
    customerPlaceholder: 'Nome do cliente',
    amount: 'Valor (R$)',
    amountPlaceholder: '0,00',
    submit: 'Adicionar Pedido',
    errorRequired: 'Preencha todos os campos.',
    errorInvalidAmount: 'Valor inválido.',
    success: 'Pedido adicionado com sucesso!',
  },
} as const;

export default pt;
