const githubService = require('../../src/services/githubService');
const githubClient = require('../../src/config/github');
const { GitHubApiError } = require('../../src/utils/errors');

jest.mock('../../src/config/github');

describe('GitHubService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPullRequest', () => {
    it('should fetch pull request data', async () => {
      const mockPR = {
        number: 1,
        title: 'Test PR',
        state: 'open'
      };

      githubClient.get.mockResolvedValue({ data: mockPR });

      const result = await githubService.getPullRequest('owner', 'repo', 1);

      expect(githubClient.get).toHaveBeenCalledWith('/repos/owner/repo/pulls/1');
      expect(result).toEqual(mockPR);
    });

    it('should handle errors', async () => {
      githubClient.get.mockRejectedValue(new GitHubApiError('Not found', 404));

      await expect(
        githubService.getPullRequest('owner', 'repo', 999)
      ).rejects.toThrow(GitHubApiError);
    });
  });

  describe('getPullRequestFiles', () => {
    it('should fetch PR files', async () => {
      const mockFiles = [
        { filename: 'test.js', status: 'modified' }
      ];

      githubClient.get.mockResolvedValue({ data: mockFiles });

      const result = await githubService.getPullRequestFiles('owner', 'repo', 1);

      expect(githubClient.get).toHaveBeenCalledWith('/repos/owner/repo/pulls/1/files');
      expect(result).toEqual(mockFiles);
    });
  });

  describe('getPullRequestDiff', () => {
    it('should fetch PR diff', async () => {
      const mockDiff = 'diff --git a/test.js b/test.js...';

      githubClient.get.mockResolvedValue({ data: mockDiff });

      const result = await githubService.getPullRequestDiff('owner', 'repo', 1);

      expect(githubClient.get).toHaveBeenCalledWith(
        '/repos/owner/repo/pulls/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.github.v3.diff'
          })
        })
      );
      expect(result).toBe(mockDiff);
    });
  });

  describe('createReview', () => {
    it('should create a review', async () => {
      const reviewData = {
        body: 'Looks good!',
        event: 'APPROVE'
      };
      const mockResponse = { id: 123, ...reviewData };

      githubClient.post.mockResolvedValue({ data: mockResponse });

      const result = await githubService.createReview('owner', 'repo', 1, reviewData);

      expect(githubClient.post).toHaveBeenCalledWith(
        '/repos/owner/repo/pulls/1/reviews',
        reviewData
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('addReviewComment', () => {
    it('should add a review comment', async () => {
      const commentData = {
        body: 'Nice change',
        path: 'test.js',
        line: 10
      };
      const mockResponse = { id: 456, ...commentData };

      githubClient.post.mockResolvedValue({ data: mockResponse });

      const result = await githubService.addReviewComment('owner', 'repo', 1, commentData);

      expect(githubClient.post).toHaveBeenCalledWith(
        '/repos/owner/repo/pulls/1/comments',
        commentData
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('requestReviewers', () => {
    it('should request reviewers', async () => {
      const reviewers = ['user1', 'user2'];
      const mockResponse = { requested_reviewers: reviewers };

      githubClient.post.mockResolvedValue({ data: mockResponse });

      const result = await githubService.requestReviewers('owner', 'repo', 1, reviewers);

      expect(githubClient.post).toHaveBeenCalledWith(
        '/repos/owner/repo/pulls/1/requested_reviewers',
        { reviewers }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAuthenticatedUser', () => {
    it('should fetch authenticated user', async () => {
      const mockUser = { login: 'testuser', id: 123 };

      githubClient.get.mockResolvedValue({ data: mockUser });

      const result = await githubService.getAuthenticatedUser();

      expect(githubClient.get).toHaveBeenCalledWith('/user');
      expect(result).toEqual(mockUser);
    });
  });

  describe('checkRepoAccess', () => {
    it('should return true for accessible repo', async () => {
      const mockRepo = { name: 'repo', owner: { login: 'owner' } };

      githubClient.get.mockResolvedValue({ data: mockRepo });

      const result = await githubService.checkRepoAccess('owner', 'repo');

      expect(result.hasAccess).toBe(true);
      expect(result.repo).toEqual(mockRepo);
    });

    it('should return false for inaccessible repo', async () => {
      githubClient.get.mockRejectedValue(new Error('Not found'));

      const result = await githubService.checkRepoAccess('owner', 'repo');

      expect(result.hasAccess).toBe(false);
      expect(result.error).toBe('Not found');
    });
  });
});
