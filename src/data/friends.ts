import friendGroups from "./friends.json";

export type Friend = {
  name: string;
  link: string;
  avatar: string;
  descr: string;
};

export type FriendGroup = {
  class_name: string;
  class_desc: string;
  link_list: Friend[];
};

export function getFriendGroups(): FriendGroup[] {
  return friendGroups as FriendGroup[];
}
