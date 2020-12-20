'use strict';

const handler = require('../../../../lib/handler');
require('dotenv').config();
const dynamodb = require('../../../../utils/dynamoDb');
const _ = require('lodash');
const fetch = require('node-fetch');

const db = dynamodb.doc;

const saveRepo = async (repo) => {
  const params = {
    TableName: 'repos',
    Item: repo,
  };
  await db
    .put(params)
    .promise()
    .catch((err) => console.log('err', err));
};

module.exports.handler = handler(async () => {
  const reposUrl =
    'https://api.github.com/orgs/iearn-finance/repos?per_page=100';
  const repos = await fetch(reposUrl).then((res) => res.json());
  const fetchContributors = async (url) => {
    const contributors = await fetch(url).then((res) => res.json());
    return contributors;
  };

  const repoFields = [
    'contributors',
    'html_url',
    'description',
    'watchers_count',
    'forks_count',
    'commits_url',
    'open_issues_count',
    'id',
    'name',
    'updated_at',
    'pushed_at',
    'created_at',
  ];

  const contributorFields = [
    'login',
    'avatar_url',
    'html_url',
    'contributions',
  ];

  const filterContributors = (contributor) =>
    _.pick(contributor, contributorFields);

  const injectContributors = async (repo) => {
    const { contributors_url: url } = repo;
    const contributors = await fetchContributors(url);
    const filteredContributors = _.map(contributors, filterContributors);
    repo.contributors = filteredContributors;
    const filteredRepo = _.pick(repo, repoFields);
    return filteredRepo;
  };

  const reposWithContributors = await Promise.all(
    _.map(repos, injectContributors),
  );

  _.each(reposWithContributors, saveRepo);
  return reposWithContributors;
});
