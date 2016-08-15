var modTextModules = require('./text-modules.js');

var animals = [
  'aardvark',
  'badger',
  'camel',
  'deer',
  'eagle',
  'fish',
  'gazelle',
  'hedgehog',
  'impala',
  'jaguar',
  'kangaroo',
  'leopard',
  'moose',
  'newt',
  'owl',
  'pig',
  'quail',
  'raccoon',
  'scorpion',
  'tiger',
  'urchin',
  'vulture',
  'walrus',
  'xerus',
  'yak',
  'zebra'
];

var rolesCYSHCN = [
  'Parent',
  'Guardian'
];

var responsibilitiesCYSHCN = [
  'Coordinate and Advocate for my child’s specific needs',
  'Provide basic daily care (daily supports, bathing, feeding, exercise, etc.)',
  'Provide financial support/stability',
  'Healthcare',
  'Plan for their future and transitions',
  'Provide emotional support, connect my child to family members and the community',
  'Self-care',
  'Coordinate mental health supports',
  'Education',
  'Transport'
];

var needsCYSHCN = [
  'Money/financial assistance',
  'Information, Knowledge, or the skills to find information',
  'Insurance benefits that cover necessary services',
  'Healthcare (providers, equipment, etc.)',
  'Equipment/supplies for basic home care',
  'Flexible work schedule',
  'Transportation',
  'Respite care',
  'Communication with others',
  'Patient Care Assistant (PCA)',
  'Supervision',
  'Understanding (from community, friends, etc.)',
  'Supports for school',
  'Opportunities for community involvement',
  'Support for other family/caregiver needs (emotional support, patience, positive attitude, etc.)',
  'Time (time management, more time to complete everything etc.)'
];

var resourcesCYSHCN = [
  'Special Education and school supports',
  'Health Providers (clinics, health professionals, at-home care, etc.)',
  'Agencies (Social Services, Department of Health, etc.)',
  'Network of family and friends',
  'Family advocacy groups',
  'Health insurance/waivers',
  'Personal philosophies, practices, etc.',
  'County resources',
  'Personal expenses for transportation (personal car, taxis, etc.)',
  'Internet-based help',
  'Flexible job that allows fluid hours',
  'Coordination services or case managers',
  'Support for supervision and socialization',
  'Supplies for basic day-to-day needs'
];

var wishesCYSHCN = [
  'Better special needs services in school',
  'Care coordination',
  'Child’s happiness and safety',
  'Child’s independence and success',
  'Money/financial support',
  'Opportunities and equipment for community involvement and activeness',
  'Transportation',
  'Information/knowledge/training',
  'Services',
  'Policies and legislation',
  'Medical/treatment advancements',
  'Housing solutions'
];

var rolesTitleV ={}; 
var responsibilitiesTitleV = {};
var needsTitleV = {};
var resourcesTitleV = {};
var wishesTitleV = {};

var CYSHCNCompletions = {
  role: rolesCYSHCN,
  responsibility: responsibilitiesCYSHCN,
  need: needsCYSHCN,
  resource: resourcesCYSHCN,
  wish: wishesCYSHCN
};

var titleVCompletions = {
  role: rolesTitleV,
  responsibility: responsibilitiesTitleV,
  need: needsTitleV,
  resource: resourcesTitleV,
  wish: wishesTitleV
};

var completionsByTextModule = {
  CaregiversCYSHCN1: CYSHCNCompletions,
  CaregiversCYSHCN2: CYSHCNCompletions,
  CaregiversCYSHCN3: CYSHCNCompletions,
  TitleVWorkforce3: titleVCompletions,
  TitleVWorkforce4: titleVCompletions,
  TitleVWorkforce5: titleVCompletions
};

exports.completionsByType = function() {
  var module = modTextModules.module;
  return completionsByTextModule[module] || CYSHCNCompletions;
};
