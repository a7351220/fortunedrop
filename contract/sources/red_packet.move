module red_packet_addr::red_packet {
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::randomness;
    use aptos_framework::event;
    use aptos_std::table::{Self, Table};
    use std::hash;
    use std::vector;

    struct RedPacket has key, store {
        id: u64,
        creator: address,
        total_amount: u64,
        remaining_amount: u64,
        recipient_count: u64,
        remaining_count: u64,
        recipients: Table<address, u64>,
        password_hash: vector<u8>,
    }

    struct RedPacketTreasury has key {
        signer_cap: account::SignerCapability,
        coins: Coin<AptosCoin>,
        next_id: u64,
        red_packets: Table<u64, address>,
    }

    struct CreatorRedPackets has key {
        red_packets: Table<u64, RedPacket>,
        red_packet_count: u64,
    }

    struct RandomnessCommitment has key {
        revealed: bool,
        value: u64,
    }

    #[event]
    struct RedPacketCreatedEvent has drop, store {
        creator: address,
        id: u64,
        total_amount: u64,
        recipient_count: u64,
    }

    #[event]
    struct RedPacketClaimedEvent has drop, store {
        claimer: address,
        creator: address,
        id: u64,
        amount: u64,
    }

    const E_INSUFFICIENT_BALANCE: u64 = 1;
    const E_INVALID_RECIPIENT_COUNT: u64 = 2;
    const E_RED_PACKET_NOT_EXIST: u64 = 3;
    const E_ALREADY_CLAIMED: u64 = 4;
    const E_NO_REMAINING_FUNDS: u64 = 5;
    const E_RANDOMNESS_COMMITMENT_NOT_EXIST: u64 = 6;
    const E_ALREADY_COMMITTED: u64 = 7;
    const E_ALREADY_REVEALED: u64 = 8;

    const RED_PACKET_SEED: vector<u8> = b"RED_PACKET";

    fun init_module(resource_account: &signer) {
        let (treasury_signer, treasury_cap) = account::create_resource_account(resource_account, RED_PACKET_SEED);
        coin::register<AptosCoin>(&treasury_signer);
        move_to(resource_account, RedPacketTreasury {
            signer_cap: treasury_cap,
            coins: coin::zero<AptosCoin>(),
            next_id: 0,
            red_packets: table::new(), 
        });
    }

    public entry fun create_red_packet(
        creator: &signer,
        total_amount: u64,
        recipient_count: u64,
        password_hash: vector<u8>
    ) acquires RedPacketTreasury, CreatorRedPackets {
        let creator_addr = signer::address_of(creator);
        
        assert!(coin::balance<AptosCoin>(creator_addr) >= total_amount, E_INSUFFICIENT_BALANCE);
        assert!(recipient_count > 0, E_INVALID_RECIPIENT_COUNT);

        let treasury = borrow_global_mut<RedPacketTreasury>(@red_packet_addr);
        let coins_to_transfer = coin::withdraw<AptosCoin>(creator, total_amount);
        coin::merge(&mut treasury.coins, coins_to_transfer);

        let red_packet_id = treasury.next_id;
        treasury.next_id = treasury.next_id + 1;

        table::add(&mut treasury.red_packets, red_packet_id, creator_addr);

        let new_red_packet = RedPacket {
            id: red_packet_id,
            creator: creator_addr,
            total_amount,
            remaining_amount: total_amount,
            recipient_count,
            remaining_count: recipient_count,
            recipients: table::new(),
            password_hash,
        };

        if (!exists<CreatorRedPackets>(creator_addr)) {
            move_to(creator, CreatorRedPackets {
                red_packets: table::new(),
                red_packet_count: 0,
            });
        };

        let creator_red_packets = borrow_global_mut<CreatorRedPackets>(creator_addr);
        table::add(&mut creator_red_packets.red_packets, red_packet_id, new_red_packet);
        creator_red_packets.red_packet_count = creator_red_packets.red_packet_count + 1;

        event::emit(RedPacketCreatedEvent {
            creator: creator_addr,
            id: red_packet_id,
            total_amount,
            recipient_count,
        });
    }

    #[randomness]
    entry fun claim_red_packet(
        claimer: &signer,
        creator: address,
        red_packet_id: u64,
        password: vector<u8>
    ) acquires CreatorRedPackets, RedPacketTreasury {
        let claimer_addr = signer::address_of(claimer);
        assert!(exists<CreatorRedPackets>(creator), E_RED_PACKET_NOT_EXIST);
        let creator_red_packets = borrow_global_mut<CreatorRedPackets>(creator);
        assert!(table::contains(&creator_red_packets.red_packets, red_packet_id), E_RED_PACKET_NOT_EXIST);

        let red_packet = table::borrow_mut(&mut creator_red_packets.red_packets, red_packet_id);
        
        assert!(hash::sha3_256(password) == red_packet.password_hash, 1000);

        let claim_amount = if (red_packet.remaining_count == 1) {
            red_packet.remaining_amount
        } else {
            let random_seed = randomness::u64_range(1, red_packet.remaining_amount);
            let max_amount = red_packet.remaining_amount - red_packet.remaining_count + 1;
            if (random_seed > max_amount) {
                max_amount
            } else {
                random_seed
            }
        };

        red_packet.remaining_amount = red_packet.remaining_amount - claim_amount;
        red_packet.remaining_count = red_packet.remaining_count - 1;
        table::add(&mut red_packet.recipients, claimer_addr, claim_amount);

        let treasury = borrow_global_mut<RedPacketTreasury>(@red_packet_addr);
        let coins_to_transfer = coin::extract(&mut treasury.coins, claim_amount);
        
        if (!coin::is_account_registered<AptosCoin>(claimer_addr)) {
            coin::register<AptosCoin>(claimer);
        };
        coin::deposit(claimer_addr, coins_to_transfer);

        event::emit(RedPacketClaimedEvent {
            claimer: claimer_addr,
            creator,
            id: red_packet_id,
            amount: claim_amount,
        });
    }

    fun verify_proof(proof: vector<u8>, commitment: vector<u8>): bool {

        hash::sha3_256(proof) == commitment
    }

    public entry fun reveal_claim_entry(claimer: &signer, creator: address, red_packet_id: u64) acquires CreatorRedPackets, RedPacketTreasury, RandomnessCommitment {
        reveal_claim_internal(claimer, creator, red_packet_id);
    }

    fun reveal_claim_internal(claimer: &signer, creator: address, red_packet_id: u64) acquires CreatorRedPackets, RedPacketTreasury, RandomnessCommitment {
        let claimer_addr = signer::address_of(claimer);
        assert!(exists<RandomnessCommitment>(claimer_addr), E_RANDOMNESS_COMMITMENT_NOT_EXIST);
        let commitment = borrow_global_mut<RandomnessCommitment>(claimer_addr);
        assert!(!commitment.revealed, E_ALREADY_REVEALED);

        let creator_red_packets = borrow_global_mut<CreatorRedPackets>(creator);
        let red_packet = table::borrow_mut(&mut creator_red_packets.red_packets, red_packet_id);

        assert!(!table::contains(&red_packet.recipients, claimer_addr), E_ALREADY_CLAIMED);
        assert!(red_packet.remaining_count > 0, E_NO_REMAINING_FUNDS);

        let claim_amount = if (red_packet.remaining_count == 1) {
            red_packet.remaining_amount
        } else {
            let max_amount = red_packet.remaining_amount - red_packet.remaining_count + 1;
            commitment.value % max_amount + 1
        };

        red_packet.remaining_amount = red_packet.remaining_amount - claim_amount;
        red_packet.remaining_count = red_packet.remaining_count - 1;
        table::add(&mut red_packet.recipients, claimer_addr, claim_amount);

        let treasury = borrow_global_mut<RedPacketTreasury>(@red_packet_addr);
        let coins_to_transfer = coin::extract(&mut treasury.coins, claim_amount);
        
        if (!coin::is_account_registered<AptosCoin>(claimer_addr)) {
            coin::register<AptosCoin>(claimer);
        };
        coin::deposit(claimer_addr, coins_to_transfer);

        commitment.revealed = true;

        event::emit(RedPacketClaimedEvent {
            claimer: claimer_addr,
            creator,
            id: red_packet_id,
            amount: claim_amount,
        });
    }

    #[view]
    public fun get_red_packet_info(red_packet_id: u64): (address, u64, u64, u64, u64) acquires RedPacketTreasury, CreatorRedPackets {
        let treasury = borrow_global<RedPacketTreasury>(@red_packet_addr);
        assert!(table::contains(&treasury.red_packets, red_packet_id), E_RED_PACKET_NOT_EXIST);
        
        let creator = *table::borrow(&treasury.red_packets, red_packet_id);
        let creator_red_packets = borrow_global<CreatorRedPackets>(creator);
        let red_packet = table::borrow(&creator_red_packets.red_packets, red_packet_id);
        
        (creator, red_packet.total_amount, red_packet.remaining_amount, red_packet.recipient_count, red_packet.remaining_count)
    }

    #[view]
    public fun is_claimed(red_packet_id: u64, claimer: address): bool acquires RedPacketTreasury, CreatorRedPackets {
        let treasury = borrow_global<RedPacketTreasury>(@red_packet_addr);
        assert!(table::contains(&treasury.red_packets, red_packet_id), E_RED_PACKET_NOT_EXIST);
        
        let creator = *table::borrow(&treasury.red_packets, red_packet_id);
        let creator_red_packets = borrow_global<CreatorRedPackets>(creator);
        let red_packet = table::borrow(&creator_red_packets.red_packets, red_packet_id);
        table::contains(&red_packet.recipients, claimer)
    }

    #[view]
    public fun get_latest_red_packet_id(): u64 acquires RedPacketTreasury {
        borrow_global<RedPacketTreasury>(@red_packet_addr).next_id - 1
    }

    #[view]
    public fun get_creator_red_packets(creator: address): vector<u64> acquires CreatorRedPackets, RedPacketTreasury {
        if (!exists<CreatorRedPackets>(creator)) {
            return vector::empty()
        };
        let creator_red_packets = borrow_global<CreatorRedPackets>(creator);
        let treasury = borrow_global<RedPacketTreasury>(@red_packet_addr);
        let red_packet_ids = vector::empty();
        let i = 0;
        while (i < treasury.next_id) {
            if (table::contains(&treasury.red_packets, i) && *table::borrow(&treasury.red_packets, i) == creator) {
                vector::push_back(&mut red_packet_ids, i);
            };
            i = i + 1;
        };
        red_packet_ids
    }
}