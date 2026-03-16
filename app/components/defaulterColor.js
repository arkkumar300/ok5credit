// Helper function to get color based on defaulter stage
const getStageColor = (stage) => {
    switch(stage) {
      case 'Stage 4':
        return '#333333'; // black - Low risk
      case 'Stage 1':
        return '#FFC107'; // Yellow - Medium risk
      case 'Stage 2':
        return '#FF9800'; // Orange - High risk
      case 'Stage 3':
        return '#F44336'; // Red - Critical risk
      default:
        return '#4CAF50'; // green - Default/Unknown
    }
  };

  export default getStageColor;