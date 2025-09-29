// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title GhostVote – 同态加密匿名投票（艺术品版）
/// @notice 作品注册、喝彩与分组投票，计数均为 FHE 加密存储，解密通过 ACL 授权。
contract GhostVote is SepoliaConfig {
    struct Piece {
        uint256 id;                    // 作品ID
        address author;                // 作者（地址）
        string title;                  // 标题（明文）
        string descriptionHash;        // 简介哈希（IPFS/Arweave 等）
        string fileHash;               // 文件哈希
        string[] tags;                 // 标签
        string[] groups;               // 分组（用于榜单/投票）
        euint32 applausesEnc;          // 加密的喝彩计数（原 likesEnc）
        uint64 createdAt;              // 上链时间
    }

    // 自增 ID
    uint256 public nextPieceId = 1;

    // 作品存储
    mapping(uint256 => Piece) private _pieces;
    uint256[] private _pieceIds;

    // 投票计数：按 (pieceId, group) 聚合
    mapping(uint256 => mapping(bytes32 => euint32)) private _ballotsByPieceAndGroup;
    mapping(uint256 => mapping(bytes32 => bool)) private _ballotsInitialized;

    // 事件（方法名与事件名均与 Gallery 版本不同）
    event PieceRegistered(uint256 indexed pieceId, address indexed author, string title);
    event PieceApplauded(uint256 indexed pieceId, address indexed user);
    event PieceBalloted(uint256 indexed pieceId, address indexed voter, string groupName);

    /// @notice 注册作品（初始化喝彩计数为 0，并授权合约与作者）。
    function registerPiece(
        string calldata title,
        string calldata descriptionHash,
        string calldata fileHash,
        string[] calldata tags,
        string[] calldata groups
    ) external returns (uint256 pieceId) {
        pieceId = nextPieceId++;

        euint32 applauses = FHE.asEuint32(0);

        Piece storage p = _pieces[pieceId];
        p.id = pieceId;
        p.author = msg.sender;
        p.title = title;
        p.descriptionHash = descriptionHash;
        p.fileHash = fileHash;
        p.createdAt = uint64(block.timestamp);
        p.applausesEnc = applauses;

        for (uint256 i = 0; i < tags.length; i++) {
            p.tags.push(tags[i]);
        }
        for (uint256 i = 0; i < groups.length; i++) {
            p.groups.push(groups[i]);
        }

        // 授权合约与作者
        FHE.allowThis(p.applausesEnc);
        FHE.allow(p.applausesEnc, msg.sender);

        _pieceIds.push(pieceId);
        emit PieceRegistered(pieceId, msg.sender, title);
    }

    /// @notice 为作品喝彩（加密计数 +1）。
    function applaudPiece(uint256 pieceId) external {
        Piece storage p = _pieces[pieceId];
        require(p.author != address(0), "Piece not found");

        p.applausesEnc = FHE.add(p.applausesEnc, 1);

        // 刷新授权：合约、作者、临时调用者
        FHE.allowThis(p.applausesEnc);
        FHE.allow(p.applausesEnc, p.author);
        FHE.allowTransient(p.applausesEnc, msg.sender);

        emit PieceApplauded(pieceId, msg.sender);
    }

    /// @notice 对作品在指定分组中投票（+1）。需作品属于该分组。
    function castBallotFor(uint256 pieceId, string calldata groupName) external {
        Piece storage p = _pieces[pieceId];
        require(p.author != address(0), "Piece not found");

        bool belongs = false;
        for (uint256 i = 0; i < p.groups.length; i++) {
            if (keccak256(bytes(p.groups[i])) == keccak256(bytes(groupName))) {
                belongs = true;
                break;
            }
        }
        require(belongs, "Piece not in group");

        bytes32 gkey = keccak256(bytes(groupName));
        euint32 current = _ballotsByPieceAndGroup[pieceId][gkey];
        if (!_ballotsInitialized[pieceId][gkey]) {
            current = FHE.asEuint32(0);
            _ballotsInitialized[pieceId][gkey] = true;
        }
        current = FHE.add(current, 1);
        _ballotsByPieceAndGroup[pieceId][gkey] = current;

        FHE.allowThis(current);
        FHE.allow(current, p.author);
        FHE.allowTransient(current, msg.sender);

        emit PieceBalloted(pieceId, msg.sender, groupName);
    }

    /// @notice 获取作品元数据与喝彩密文句柄。
    function fetchPiece(uint256 pieceId)
        external
        view
        returns (
            uint256 id,
            address author,
            string memory title,
            string memory descriptionHash,
            string memory fileHash,
            string[] memory tags,
            string[] memory groups,
            uint64 createdAt,
            euint32 applausesHandle
        )
    {
        Piece storage p = _pieces[pieceId];
        require(p.author != address(0), "Piece not found");
        return (
            p.id,
            p.author,
            p.title,
            p.descriptionHash,
            p.fileHash,
            p.tags,
            p.groups,
            p.createdAt,
            p.applausesEnc
        );
    }

    /// @notice 获取全部作品 ID 列表。
    function listPieces() external view returns (uint256[] memory ids) {
        return _pieceIds;
    }

    /// @notice 获取指定作品在某分组下的投票计数（密文句柄）。
    function ballotBoxOf(uint256 pieceId, string calldata groupName) external view returns (euint32 ballotsHandle) {
        bytes32 gkey = keccak256(bytes(groupName));
        return _ballotsByPieceAndGroup[pieceId][gkey];
    }
}




